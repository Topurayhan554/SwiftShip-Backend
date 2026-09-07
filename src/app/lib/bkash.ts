import httpStatus from "http-status";
import config from "../config";
import { AppError } from "../utils/AppError";
import { redisClient } from "./redis";

export const getBkashIdToken = async () => {
  try {
    const IdTokenKey = "bkash:idToken";
    const RefreshTokenKey = "bkash:refreshToken";

    let bkashIdToken = await redisClient.get(IdTokenKey);
    const bkashIdTokenTTL = await redisClient.ttl(IdTokenKey);
    const bkashRefreshToken = await redisClient.get(RefreshTokenKey);
    const bkashRefreshTokenTTL = await redisClient.ttl(RefreshTokenKey);

    if (
      (bkashIdTokenTTL <= 600 || !bkashIdToken) &&
      bkashRefreshToken &&
      bkashRefreshTokenTTL > 600
    ) {
      const refreshResponse = await fetch(
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

      if (!refreshResponse.ok) {
        throw new AppError(
          httpStatus.BAD_GATEWAY,
          "Bkash Access Token Refresh Failed",
        );
      }

      const refreshResult = await refreshResponse.json();
      bkashIdToken = refreshResult.id_token as string;

      await redisClient.set(IdTokenKey, bkashIdToken, {
        expiration: { type: "EX", value: 60 * 60 },
      });

      return bkashIdToken;
    }

    // still valid
    if (bkashIdToken && bkashIdTokenTTL > 600) {
      return bkashIdToken;
    }

    // fresh grant
    const grantResponse = await fetch(
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

    if (!grantResponse.ok) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        "Bkash Access Token Grant Failed",
      );
    }

    const grantResult = await grantResponse.json();

    await redisClient.set(IdTokenKey, grantResult.id_token, {
      expiration: { type: "EX", value: 60 * 60 },
    });
    await redisClient.set(RefreshTokenKey, grantResult.refresh_token, {
      expiration: { type: "EX", value: 60 * 60 * 24 * 28 },
    });

    return grantResult.id_token as string;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(httpStatus.BAD_GATEWAY, error.message);
  }
};
