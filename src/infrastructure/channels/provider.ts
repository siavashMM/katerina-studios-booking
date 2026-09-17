export type ChannelConnectionStatus = "CONNECTED" | "NOT_CONNECTED" | "MANUAL_ONLY";

export interface ChannelManagerProvider {
  readonly name: string;
  connectionStatus(): ChannelConnectionStatus;
}

export interface BookingComChannelProvider extends ChannelManagerProvider {
  readonly name: "Booking.com";
}

export interface AirbnbChannelProvider extends ChannelManagerProvider {
  readonly name: "Airbnb";
}

export class ManualBookingComProvider implements BookingComChannelProvider {
  readonly name = "Booking.com";

  connectionStatus(): ChannelConnectionStatus {
    return "MANUAL_ONLY";
  }
}

export class ManualAirbnbProvider implements AirbnbChannelProvider {
  readonly name = "Airbnb";

  connectionStatus(): ChannelConnectionStatus {
    return "MANUAL_ONLY";
  }
}
