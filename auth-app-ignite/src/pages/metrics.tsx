import type { GetServerSideProps, NextPage } from "next";
import { setupAPIClient } from "../services/api";
import { withSSRAuth } from "../util/withSSRAuth";
import decode from "jwt-decode";

const Metrics: NextPage = () => {
  return (
    <>
      <h1>Metrics</h1>
    </>
  );
};

export default Metrics;

export const getServerSideProps = withSSRAuth<{ user: string[] }>(
  async (ctx) => {
    const apiClient = setupAPIClient(ctx);
    await apiClient.get("/me");

    return {
      props: {
        user: ["erick"],
      },
    };
  },
  {
    permissions: ["metrics.listss"],
    roles: ["administrator"],
  }
);
