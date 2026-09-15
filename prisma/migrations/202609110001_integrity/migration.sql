-- Policy content is immutable. Retire a version and insert a new version.
CREATE FUNCTION protect_policy_content() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW."propertyId", NEW.version, NEW.summary, NEW."isDemo") IS DISTINCT FROM
     (OLD."propertyId", OLD.version, OLD.summary, OLD."isDemo") THEN
    RAISE EXCEPTION 'Policy content is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER policy_content_immutable BEFORE UPDATE ON "PolicyVersion"
FOR EACH ROW EXECUTE FUNCTION protect_policy_content();

CREATE FUNCTION check_reservation_relations() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE unit_property uuid; capacity integer; policy_property uuid;
BEGIN
  SELECT "propertyId", "maxGuests" INTO unit_property, capacity FROM "Accommodation" WHERE id = NEW."accommodationId";
  SELECT "propertyId" INTO policy_property FROM "PolicyVersion" WHERE id = NEW."policyVersionId";
  IF unit_property IS DISTINCT FROM NEW."propertyId" OR policy_property IS DISTINCT FROM NEW."propertyId" OR NEW.guests > capacity THEN
    RAISE EXCEPTION 'Reservation property or capacity mismatch' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER reservation_relations BEFORE INSERT OR UPDATE OF "accommodationId", "policyVersionId", "propertyId", guests ON "Reservation"
FOR EACH ROW EXECUTE FUNCTION check_reservation_relations();

CREATE FUNCTION check_allocation_reservation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."reservationId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "Reservation" r WHERE r.id = NEW."reservationId" AND r."accommodationId" = NEW."accommodationId"
      AND r."checkIn" = NEW."startDate" AND r."checkOut" = NEW."endDate"
  ) THEN
    RAISE EXCEPTION 'Allocation does not match its reservation' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER allocation_reservation BEFORE INSERT OR UPDATE ON "InventoryAllocation"
FOR EACH ROW EXECUTE FUNCTION check_allocation_reservation();
