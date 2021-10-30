import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../services/apiClient";
import Router from "next/router";
import { setCookie, parseCookies, destroyCookie } from "nookies";

type signInCredentials = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn(credentials: signInCredentials): Promise<void>;
  user: User | undefined;
  isAuthenticated: boolean;
  signOut: () => void;
};

type AuthProviderProps = {
  children: ReactNode;
};

type User = {
  email: string;
  permissions: string[];
  roles: string[];
  token?: string | undefined;
  refreshToken?: string | undefined;
};

const AuthContext = createContext({} as AuthContextData);

let authChannel: BroadcastChannel;

export function signOut() {
  destroyCookie(undefined, "nextauth.token");
  destroyCookie(undefined, "nextauth.refreshToken");

  authChannel.postMessage("sigOut");

  Router.push("/");
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  //OBS: 2 possibilidade poderia vir os dados do payload.
  async function recoverDataUserLogged() {
    try {
      const { "nextauth.token": token } = parseCookies();

      if (token) {
        const { data } = await api.get<User>("/me");
        const { email, permissions, roles } = data;
        setUser({ email, permissions, roles });
      }
    } catch (err) {
      signOut();
    }
  }

  useEffect(() => {
    recoverDataUserLogged();
  }, []);

  useEffect(() => {
    authChannel = new BroadcastChannel("auth");

    authChannel.onmessage = (message) => {
      switch (message.data) {
        case "sigOut":
          signOut();
          break;
        default:
          break;
      }
    };
  }, []);

  async function signIn({ email, password }: signInCredentials) {
    try {
      console.log({ email, password });

      const response = await api.post<User>("sessions", { email, password });

      //diego@rocketseat.team
      //123456
      const { token, refreshToken, permissions, roles } = response.data;

      //sessionsStorage = durante o navegador aberto.
      // localStorage = salva permanente no navegador.
      // cookies = salva permanente e tem acesso ao servidor. (serverside).

      setCookie(undefined, "nextauth.token", `${token}`, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/", //all paths.
      });

      setCookie(undefined, "nextauth.refreshToken", `${refreshToken}`, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/", //all paths
      });

      setUser({
        email,
        permissions,
        roles,
      });

      api.defaults.headers["Authorization"] = `Bearer ${token}`;

      Router.push("/dashboard");
    } catch (err) {
      console.log(err.response);
    }
  }

  return (
    <AuthContext.Provider value={{ user, signOut, signIn, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
