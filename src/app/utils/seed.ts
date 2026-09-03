import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { Role } from "../../generated/prisma/enums";
import config from "../config";

const hashPassword = (password: string) =>
  bcrypt.hash(password, Number(config.bcrypt_salt_rounds));

export const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExist = await prisma.user.findFirst({
      where: { role: Role.SUPER_ADMIN },
    });

    if (isSuperAdminExist) {
      console.log("Super Admin Already Exists!");
      return;
    }

    const name = config.super_admin_name;
    const email = config.super_admin_email;
    const password = config.super_admin_password;

    if (!name || !email || !password) {
      throw new Error(
        "Super Admin Name, Email, Password Missing In Env File!!!",
      );
    }

    const hashedPassword = await hashPassword(password);

    const superAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.SUPER_ADMIN,
        status: "ACTIVE",
        authProvider: "CREDENTIALS",
        isEmailVerified: true,
      },
    });

    // console.log("Super Admin Created : ", superAdmin.email);
  } catch (error) {
    console.log("Error Seeding Super Admin : ", error);
    await prisma.user
      .delete({ where: { email: config.super_admin_email } })
      .catch(() => undefined);
  }
};

export const seedTesterAdmin = async () => {
  try {
    const email = config.tester_admin_email;
    const isExist = await prisma.user.findUnique({ where: { email } });

    if (isExist) {
      console.log("Tester Admin Already Exists!");
      return;
    }

    const name = config.tester_admin_name;
    const password = config.tester_admin_password;

    if (!name || !email || !password) {
      throw new Error(
        "Tester Admin Name, Email, Password Missing In Env File!!!",
      );
    }

    const hashedPassword = await hashPassword(password);

    const testerAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.ADMIN,
        status: "ACTIVE",
        authProvider: "CREDENTIALS",
        isEmailVerified: true,
      },
    });

    // console.log("Tester Admin Created : ", testerAdmin.email);
  } catch (error) {
    console.log("Error Seeding Tester Admin : ", error);
    await prisma.user
      .delete({ where: { email: config.tester_admin_email } })
      .catch(() => undefined);
  }
};

export const seedTesterCourier = async () => {
  try {
    const email = config.tester_courier_email;
    const isExist = await prisma.user.findUnique({ where: { email } });

    if (isExist) {
      console.log("Tester Courier Already Exists!");
      return;
    }

    const name = config.tester_courier_name;
    const password = config.tester_courier_password;

    if (!name || !email || !password) {
      throw new Error(
        "Tester Courier Name, Email, Password Missing In Env File!!!",
      );
    }

    const hashedPassword = await hashPassword(password);

    const testerCourier = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.COURIER,
        status: "ACTIVE",
        authProvider: "CREDENTIALS",
        isEmailVerified: true,
        vehicleType: "Motorcycle",
        licenseNumber: "DL-TEST-0001",
        isAvailable: true,
      },
    });

    // console.log("Tester Courier Created : ", testerCourier.email);
  } catch (error) {
    console.log("Error Seeding Tester Courier : ", error);
    await prisma.user
      .delete({ where: { email: config.tester_courier_email } })
      .catch(() => undefined);
  }
};

async function main() {
  console.log("Seeding database...");

  await seedSuperAdmin();
  await seedTesterAdmin();
  await seedTesterCourier();

  console.log("Seeding complete.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
