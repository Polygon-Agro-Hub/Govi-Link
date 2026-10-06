import { getDevServerHostIp } from "./getHostIp";
const devHostIp = getDevServerHostIp();

const environment = {
  // LOCAL --------------------
  // API_BASE_URL: `http://${devHostIp}:3000/govilink/`,

  // DEV --------------------
  // API_BASE_URL: "https://govi-link-back-dev-api.vercel.app/govilink/",

  // UAT --------------------
  // API_BASE_URL: "https://govi-link-api-uat.vercel.app/govilink/",

  // PROD --------------------
  // API_BASE_URL: "https://govi-link-back-prod-api.vercel.app/govilink/",

};

export default environment;
