export type FamilyStory = {
  enabled: boolean;
  heading: string;
  supportingLine: string;
  introduction: string;
  foundedYear: number | null;
  generations: number | null;
  founderName: string | null;
  familyMembers: string[];
  storyParagraphs: string[];
  verifiedHistory: boolean;
  welcomeMessage: string | null;
  hostName: string | null;
  hostPhotoId: string | null;
  hostBiography: string | null;
  place: {
    heading: string;
    paragraphs: string[];
    primaryPhotoId: string;
    secondaryPhotoId: string;
  };
  paleokastritsa: {
    heading: string;
    paragraphs: string[];
    photoId: string;
  };
};

const familyStory: FamilyStory = {
  enabled: true,
  heading: "A family-run place in Paleokastritsa",
  supportingLine: "A family-run stay in Paleokastritsa, Corfu.",
  introduction:
    "Katerina Studios is a family-run place to stay in Paleokastritsa, Corfu. The property sits on a hillside among olive trees and has views towards the Ionian Sea. The family welcomes guests directly and keeps each stay simple and personal.",
  foundedYear: null,
  generations: null,
  founderName: null,
  familyMembers: [],
  storyParagraphs: [],
  verifiedHistory: false,
  welcomeMessage: null,
  hostName: null,
  hostPhotoId: null,
  hostBiography: null,
  place: {
    heading: "Among the olive trees.",
    paragraphs: [
      "The studios sit on a green hillside in Paleokastritsa. Olive trees and stone paths surround the white buildings.",
      "Balconies and terraces look towards the Ionian Sea. The landscape connects the property to this part of Corfu.",
    ],
    primaryPhotoId: "garden-path",
    secondaryPhotoId: "studio-building",
  },
  paleokastritsa: {
    heading: "A place shaped by the coast.",
    paragraphs: [
      "Paleokastritsa brings together green hillsides, olive trees, beaches, and the Ionian coastline. Katerina Studios is part of this landscape.",
      "Guests can explore the coast and return to the hillside setting of the property.",
    ],
    photoId: "balcony-sea-view",
  },
};

export const property = {
  name: "Katerina Studios",
  place: "Paleokastritsa, Corfu",
  country: "Greece",
  familyBusiness: true,
  familyStory,
  introduction:
    "Blue water beyond the olive trees. Light through the balcony doors. Explore Katerina Studios and plan your time in Paleokastritsa.",
} as const;

// These records explain the demo. Booking data and prices come from the server.
export const demoStudios = [
  {
    slug: "demo-studio-a",
    name: "Demo Studio A",
    title: "Light, colour, and a place to rest.",
    description:
      "Explore an example studio page, then select your dates to check the sample availability.",
    photoIds: ["studio-colourful-bed", "balcony-striped-chairs", "kitchenette"],
  },
  {
    slug: "demo-studio-b",
    name: "Demo Studio B",
    title: "A simple space for your Corfu stay.",
    description:
      "See how a second studio appears in the booking flow. The owner will confirm the actual studio details before launch.",
    photoIds: ["studio-blue-bed", "studio-balcony-door", "balcony-evening"],
  },
] as const;

export const practicalQuestions = [
  {
    question: "How does a booking request work?",
    answer:
      "Select your dates and studio. Enter your name and email, then review and send your request. Your reservation is confirmed only after the owner accepts it.",
  },
  {
    question: "When do I pay?",
    answer:
      "The proposed payment method is cash on arrival. The site does not collect card details. Check the total and the payment terms before you send a request.",
  },
  {
    question: "What are the arrival and departure times?",
    answer:
      "The owner must confirm these times before the site accepts real booking requests. Your confirmation will include the arrival instructions.",
  },
  {
    question: "Can I ask about access, parking, or other needs?",
    answer:
      "Check these details with the owner before you travel. The supplied photos show outdoor steps. They do not establish step-free access or guaranteed parking.",
  },
] as const;
