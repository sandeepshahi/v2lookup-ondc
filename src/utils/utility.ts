import axios, { AxiosError } from "axios";
import { REGISTRY_URLS } from "../config/constants";
import "dotenv/config";
import sodium from "libsodium-wrappers";
import { writeFile } from "fs/promises";

const getEnvDetails = (env: string) => {
  let envLink = "";
  if (env === "preprod") {
    envLink = REGISTRY_URLS.PREPROD;
  } else if (env === "prod") {
    envLink = REGISTRY_URLS.PROD;
  } else if (env === "staging") {
    envLink = REGISTRY_URLS.STAGE;
  }

  return envLink;
};

const fetchRegistryResponse = async (
  payload: any,
  header: string,
  envLink: string
) => {
  try {
    // console.log(payload);
    const response = await axios.post(envLink, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: header,
      },
    });

    return response;
  } catch (error) {
    throw error;
  }
};

const createSigningString = async (message: string) => {
  const created = Math.floor(new Date().getTime() / 1000).toString();
  const expires = (parseInt(created, 10) + 1 * 60 * 60).toString();

  await sodium.ready;

  // const sodium = _sodium;
  const digest = sodium.crypto_generichash(64, sodium.from_string(message));
  const digestBase64 = sodium.to_base64(
    digest,
    sodium.base64_variants.ORIGINAL
  );

  const signingString = `(created): ${created}
(expires): ${expires}
digest: BLAKE-512=${digestBase64}`;

  return { signingString, created, expires };
};

const sign = async (signingString: string, privateKey: string) => {
  await sodium.ready;
  const signedMessage = sodium.crypto_sign_detached(
    signingString,
    sodium.from_base64(privateKey, sodium.base64_variants.ORIGINAL)
  );
  return sodium.to_base64(signedMessage, sodium.base64_variants.ORIGINAL);
};

const createHeader = (
  subscriberId: string,
  ukId: string,
  created: string,
  expires: string,
  signature: string
) => {
  const header = `Signature keyId="${subscriberId}|${ukId}|ed25519",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`;
  return header;
};

const saveJsonResponse = (res: any) => {
  try {
    // Save the response data to a file
    writeFile("response.json", res);

    console.log("Registry response saved to response.json");
  } catch (error) {
    console.error("Error saving response:", error);
  }
};

export const v2LookUp = async (data: any) => {
  try {
    const { subscriberId, privateKey, ukId, env, payload, saveJson } = data;
    const stringifiedPayload = JSON.stringify(payload);

    const { signingString, created, expires } = await createSigningString(
      stringifiedPayload
    );
    // console.log("signingString:", signingString);
    const signature = await sign(signingString, privateKey);
    // console.log("signature:\n", signature);

    const header = createHeader(
      subscriberId,
      ukId,
      created,
      expires,
      signature
    );

    const envLink = getEnvDetails(env);

    let res = await fetchRegistryResponse(stringifiedPayload, header, envLink);

    const resString = JSON.stringify(res.data, null, 2);
    if (saveJson) saveJsonResponse(resString);

    return resString;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error("Axios error:", error.response?.data);
    } else if (error instanceof Error) {
      console.error("General error:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }
  }
};
