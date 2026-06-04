import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

/** For Client Components / the browser (`withCredentials` for cookies). */
export const clientApi = axios.create({
  baseURL,
  withCredentials: true,
});
