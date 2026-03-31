export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "leader" | "member";
  status: "confirmed" | "pending";
  avatar: string;
}

export interface EnrolledItem {
  kind: "competition" | "event";
  id: string;
  slug: string;
  title: string;
  image: string;
  category: string;
  date: string;
  status: "open" | "closed" | "cancelled" | "postponed";
  teamSize: string;
  team?: TeamMember[];
}

export interface ProfileState {
  name: string;
  email: string;
  bio: string;
  college: string;
  year: string;
  gender: string;
  city: string;
  state: string;
  whatsapp: string;
  image: string;
  collegeIdPic: string;
  govtIdPic: string;
}

export const EMPTY_PROFILE: ProfileState = {
  name: "",
  email: "",
  bio: "",
  college: "",
  year: "",
  gender: "",
  city: "",
  state: "",
  whatsapp: "",
  image: "",
  collegeIdPic: "",
  govtIdPic: "",
};
