import os from "node:os";

try {
  os.userInfo();
} catch (error) {
  if (
    error?.code !== "ERR_SYSTEM_ERROR" ||
    !error.message.includes("uv_os_get_passwd")
  ) {
    throw error;
  }

  const username = process.env.USERNAME || process.env.USER;
  const homedir = process.env.USERPROFILE || os.homedir();

  if (!username || !homedir) throw error;

  os.userInfo = () => ({
    username,
    uid: -1,
    gid: -1,
    shell: null,
    homedir,
  });
}
