import axios, { AxiosError } from "axios";
import Router from "next/router";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/AuthContext";
import { AuthTokenError } from "../errors/AuthTokenError";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
  token?: string | undefined;
  refreshToken?: string | undefined;
};


let isRefreshing = false;
let failedRequestsQueue = [];


export function setupAPIClient(ctx = undefined) {
  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: "http://localhost:3333/",
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    },
  })

  api.interceptors.response.use(response => {
    return response;
  }, (error: AxiosError) => {
    console.log(error?.response?.status)
    if (error?.response?.data.code === "token.expired") {
      cookies = parseCookies(ctx);

      const { "nextauth.refreshToken": refreshToken } = cookies;

      const originalConfig = error.config;
      if (!isRefreshing) {
        isRefreshing = true;

        api.post<User>("/refresh", { refreshToken }).then(response => {
          const { token } = response.data;

          setCookie(ctx, "nextauth.token", `${token}`, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/", //all paths.
          });

          setCookie(ctx, "nextauth.refreshToken", `${response.data.refreshToken}`, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/", //all paths
          });

          api.defaults.headers["Authorization"] = `Bearer ${token}`;

          failedRequestsQueue.forEach(request => request.resolve(token));
          failedRequestsQueue = [];
        }).catch(err => {
          failedRequestsQueue.forEach(request => request.reject());
          failedRequestsQueue = [];

          if (process.browser) {
            signOut()
          }

        }).finally(() => {
          isRefreshing = false
        });
      }

      return new Promise((resolve, reject) => {
        failedRequestsQueue.push({
          resolve: (token: string) => {
            originalConfig.headers["Authorization"] = `Bearer ${token}`

            resolve(api(originalConfig))
          },
          reject: (err: AxiosError) => {
            reject(err);
          }
        });
      })
    } else {
      if (process.browser) {
        signOut()
      }else{
        return Promise.reject(new AuthTokenError())
      }
    }


    return Promise.reject(error);
  });

  return api;
}