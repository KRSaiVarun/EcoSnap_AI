// Real carbon emission factors from environmental databases
export const carbonData = {
  transport: {
    car: {
      factor: 0.21,
      unit: "per km",
      details: "Average petrol car"
    },
    electric_car: {
      factor: 0.05,
      unit: "per km",
      details: "Electric vehicle"
    },
    bus: {
      factor: 0.08,
      unit: "per km",
      details: "Local bus"
    },
    train: {
      factor: 0.04,
      unit: "per km",
      details: "Electric train"
    },
    plane: {
      factor: 0.25,
      unit: "per km",
      details: "Short-haul flight"
    },
    bike: {
      factor: 0,
      unit: "per km",
      details: "Zero emissions"
    }
  },

  food: {
    beef: {
      factor: 27,
      unit: "per kg",
      details: "Beef (beef herd)"
    },
    lamb: {
      factor: 24,
      unit: "per kg",
      details: "Lamb/mutton"
    },
    cheese: {
      factor: 13.5,
      unit: "per kg",
      details: "Cheese"
    },
    chicken: {
      factor: 6.5,
      unit: "per kg",
      details: "Chicken meat"
    },
    tofu: {
      factor: 2,
      unit: "per kg",
      details: "Tofu"
    },
    beans: {
      factor: 1.5,
      unit: "per kg",
      details: "Beans"
    }
  },

  // Add more categories...
};

export function getEquivalent(kgCO2: number): string {
  if (kgCO2 < 1) {
    return `${Math.round(kgCO2 * 1000)} grams of CO2`;
  }

  const equivalents = [
    { threshold: 100, text: `${Math.round(kgCO2 / 100)} months of average household electricity` },
    { threshold: 10, text: `${Math.round(kgCO2 / 10)} tree-months of carbon absorption` },
    { threshold: 1, text: `${Math.round(kgCO2)} kg of CO2` }
  ];

  for (const eq of equivalents) {
    if (kgCO2 >= eq.threshold) {
      return eq.text;
    }
  }

  return `${kgCO2} kg of CO2`;
}
