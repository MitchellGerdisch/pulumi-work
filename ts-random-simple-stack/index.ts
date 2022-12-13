import * as random from "@pulumi/random";

import * as config from "./config";

const petLength = config.petLength

const randomPet = new random.RandomPet("random-pet", {
  length: petLength,
  prefix: config.petNamePrefix
});

export const petName = randomPet.id;
