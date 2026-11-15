const { transaction } = require('../config/database');
const repository = require('../repositories/user-repository');
const { hashPassword, isPasswordHash } = require('../utils/passwords');

async function migratePasswords() {
  return transaction(async (connection) => {
    const users = await repository.listPasswords(connection);
    let migrated = 0;
    for (const user of users) {
      if (isPasswordHash(user.password)) continue;
      const passwordHash = await hashPassword(user.password);
      await repository.updatePassword(user.id, passwordHash, connection);
      migrated += 1;
    }
    return { inspected: users.length, migrated, alreadyHashed: users.length - migrated };
  });
}

module.exports = { migratePasswords };
