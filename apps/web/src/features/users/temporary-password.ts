const TEMPORARY_PASSWORD_LENGTH = 18;

const TEMPORARY_PASSWORD_CHARSETS = {
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  lowercase: "abcdefghijkmnopqrstuvwxyz",
  numbers: "23456789",
  symbols: "!@#$%&*?-_",
} as const;

function getSecureRandomIndex(maxExclusive: number) {
  const randomValues = new Uint32Array(1);
  crypto.getRandomValues(randomValues);

  return randomValues[0] % maxExclusive;
}

function getSecureRandomChar(charset: string) {
  return charset[getSecureRandomIndex(charset.length)];
}

function shuffleSecurely(characters: string[]) {
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = getSecureRandomIndex(index + 1);

    [characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ];
  }

  return characters;
}

export function generateTemporaryPassword() {
  const requiredCharacters = [
    getSecureRandomChar(TEMPORARY_PASSWORD_CHARSETS.uppercase),
    getSecureRandomChar(TEMPORARY_PASSWORD_CHARSETS.lowercase),
    getSecureRandomChar(TEMPORARY_PASSWORD_CHARSETS.numbers),
    getSecureRandomChar(TEMPORARY_PASSWORD_CHARSETS.symbols),
  ];

  const allCharacters = Object.values(TEMPORARY_PASSWORD_CHARSETS).join("");

  const remainingCharacters = Array.from({
    length: TEMPORARY_PASSWORD_LENGTH - requiredCharacters.length,
  }).map(() => getSecureRandomChar(allCharacters));

  return shuffleSecurely([...requiredCharacters, ...remainingCharacters]).join("");
}
