import axios from "axios";
import { cookies } from "next/headers";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

// 1. Client Instance (For Client Components / Browser)
// Browsers automatically send cookies with requests if 'withCredentials' is true
export const clientApi = axios.create({
  baseURL,
  withCredentials: true, 
});

// 2. Server Instance (For Server Components / Actions)
export const serverApi = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  return axios.create({
    baseURL,
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
};
