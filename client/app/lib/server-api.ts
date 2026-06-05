import axios from "axios";
import { cookies } from "next/headers";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

/** For Server Components / Actions — forwards `token` cookie as Bearer when present. */
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
