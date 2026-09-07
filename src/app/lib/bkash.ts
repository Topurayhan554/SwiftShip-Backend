import config from "../config";
import { redisClient } from "./redis";

interface IBkashTokenGrantResponse {
  id_token: string;
  refresh_token: string;
}

export const getBkashIdToken = async () => {
  try {
    const IdTokenKey = "bkash:idToken";
    const RefreshTokenKey = "bkash:refreshToken";

    let bkashIdToken = await redisClient.get(IdTokenKey);
    const bkashIdTokenTTL = await redisClient.ttl(IdTokenKey);
    const bkashRefreshToken = await redisClient.get(RefreshTokenKey);
    const bkashRefreshTokenTTL = await redisClient.ttl(RefreshTokenKey);

    if (bkashIdTokenTTL > 600 && bkashIdToken) {
      return bkashIdToken;
    }

    if (
      (bkashIdTokenTTL <= 600 || !bkashIdToken) &&
      bkashRefreshToken &&
      bkashRefreshTokenTTL > 600
    ) {
      const refreshTokenResponse = await fetch(
        `${config.bkash_base_url}/tokenized/checkout/token/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            username: config.bkash_username,
            password: config.bkash_password,
          },
          body: JSON.stringify({
            app_key: config.bkash_app_key,
            app_secret: config.bkash_app_secret,
            refresh_token: bkashRefreshToken,
          }),
        },
      );

      if (!refreshTokenResponse.ok) {
        throw new Error("Bkash Access Token Refresh Failed");
      }

      const refreshResult: IBkashTokenGrantResponse =
        await refreshTokenResponse.json();
      bkashIdToken = refreshResult.id_token;

      await redisClient.set(IdTokenKey, bkashIdToken, {
        expiration: { type: "EX", value: 60 * 60 },
      });

      return bkashIdToken;
    }

    const response = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/token/grant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: config.bkash_username,
          password: config.bkash_password,
        },
        body: JSON.stringify({
          app_key: config.bkash_app_key,
          app_secret: config.bkash_app_secret,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Bkash Access Token Grant Failed");
    }

    const result: IBkashTokenGrantResponse = await response.json();

    await redisClient.set(IdTokenKey, result.id_token, {
      expiration: { type: "EX", value: 60 * 60 },
    });

    await redisClient.set(RefreshTokenKey, result.refresh_token, {
      expiration: { type: "EX", value: 60 * 60 * 24 * 28 },
    });

    return result.id_token;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const createBkashPayment = async (payload: {
  amount: number;
  merchantInvoiceNumber: string;
  callbackURL: string;
}) => {
  const token = await getBkashIdToken();

  const response = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: token as string,
        "X-App-Key": config.bkash_app_key,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: payload.merchantInvoiceNumber,
        callbackURL: payload.callbackURL,
        amount: payload.amount.toString(),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: payload.merchantInvoiceNumber,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Bkash Create Payment Failed");
  }

  return response.json();
};

export const executeBkashPayment = async (paymentID: string) => {
  const token = await getBkashIdToken();

  const response = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/execute`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: token as string,
        "X-App-Key": config.bkash_app_key,
      },
      body: JSON.stringify({ paymentID }),
    },
  );

  if (!response.ok) {
    throw new Error("Bkash Execute Payment Failed");
  }

  return response.json();
};
