import { useMutation, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

type UserId = string;

type UpdateUserProfilePayload = {
  userId: UserId;
  city?: string;
  state?: string;
  collegeName?: string;
  gender?: string;
  whatsappNumber?: string;
  stream?: string;
  yearOfStudy?: string;
  image?: File;
  collegeIdPic?: File;
  govtIdPic?: File;
};

type UpdateUserProfileResponse = {
  user: {
    id: string;
    email: string;
    name?: string;
    city?: string;
    state?: string;
    collegeName?: string;
    collegeIdPic?: string;
    govtIdPic?: string;
    gender?: string;
    whatsappNumber?: string;
    stream?: string;
    yearOfStudy?: string;
    image?: string;
    qrToken?: string;
    [key: string]: unknown;
  };
  qrUrl?: string;
};

/**
 * Update user profile with optional image uploads
 * Handles city, state, collegeName, gender, whatsappNumber, stream, yearOfStudy
 * Can upload 3 files: image, collegeIdPic, govtIdPic
 * Auto-generates QR code if profile becomes complete
 */
export function useUpdateUserProfile() {
  return useMutation({
    mutationFn: async ({
      userId,
      city,
      state,
      collegeName,
      gender,
      whatsappNumber,
      stream,
      yearOfStudy,
      image,
      collegeIdPic,
      govtIdPic,
    }: UpdateUserProfilePayload): Promise<UpdateUserProfileResponse> => {
      const formData = new FormData();

      // Append text fields
      if (city !== undefined) formData.append("city", city);
      if (state !== undefined) formData.append("state", state);
      if (collegeName !== undefined)
        formData.append("collegeName", collegeName);
      if (gender !== undefined) formData.append("gender", gender);
      if (whatsappNumber !== undefined)
        formData.append("whatsappNumber", whatsappNumber);
      if (stream !== undefined) formData.append("stream", stream);
      if (yearOfStudy !== undefined)
        formData.append("yearOfStudy", yearOfStudy);

      // Append files
      if (image) formData.append("image", image);
      if (collegeIdPic) formData.append("collegeIdPic", collegeIdPic);
      if (govtIdPic) formData.append("govtIdPic", govtIdPic);

      const { data } = await apiClient.patch(
        `/users/${userId}/profile`,
        formData,
      );

      return data?.data;
    },
  });
}

export function useMyQRCode(enabled = true) {
  return useQuery<string>({
    queryKey: ["qr", "me"],
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.get("/qr/me");
      return data?.data?.qrCode || "";
    },
    staleTime: 5 * 60 * 1000,
  });
}
