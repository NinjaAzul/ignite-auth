import type { GetServerSideProps, NextPage } from "next";
import { useState, FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/styles.module.css";
import { withSSRGuest } from "../util/withSSRGuest";

const Home: NextPage = () => {
  const { signIn, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const data = {
      email,
      password,
    };

    await signIn(data);
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <div className={styles.content}>
        <input
          className={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className={styles.button}>
          Entrar
        </button>
      </div>
    </form>
  );
};

export default Home;

export const getServerSideProps = withSSRGuest<{ user: string[] }>(
  async (ctx) => {
    return {
      props: {
        user: ["erick"],
      },
    };
  }
);
