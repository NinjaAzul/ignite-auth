import type { GetServerSideProps, NextPage } from "next";
import { Can } from "../components/Can";
import { useAuth } from "../contexts/AuthContext";
import { useCan } from "../hook/useCan";
import { setupAPIClient } from "../services/api";
import { withSSRAuth } from "../util/withSSRAuth";

const Dashboard: NextPage = () => {
  const { user ,signOut} = useAuth();
  const userCanSeeMethics = useCan({ roles: ["administrator"] });

  return (
    <>
      <h1>Dashboard: {user?.email}</h1>

      {userCanSeeMethics && <div>Métricas</div>}

      <Can permissions={["metrics.list"]}>
        <input />
      </Can>


      <button onClick={signOut}>signOut</button>
    </>
  );
};

export default Dashboard;

export const getServerSideProps = withSSRAuth<{ user: string[] }>(
  async (ctx) => {
    const apiClient = setupAPIClient(ctx);
    await apiClient.get("/me");

    return {
      props: {
        user: ["erick"],
      },
    };
  }
);
