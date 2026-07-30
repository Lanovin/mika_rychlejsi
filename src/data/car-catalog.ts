// Katalog značek a modelů pro oceňovací formulář výkupu.
// Značky se exportují seřazené abecedně (česká abeceda), aby se v seznamu
// dobře hledalo.

export interface CarBrand {
  brand: string;
  models: string[];
}

const brands: CarBrand[] = [
  {
    brand: "Škoda",
    models: ["Fabia", "Octavia", "Superb", "Scala", "Kamiq", "Karoq", "Kodiaq", "Enyaq", "Rapid", "Citigo", "Yeti", "Roomster", "Felicia"],
  },
  {
    brand: "Volkswagen",
    models: ["Golf", "Passat", "Polo", "Tiguan", "Touran", "T-Roc", "T-Cross", "Touareg", "Arteon", "Caddy", "Transporter", "Sharan", "up!", "ID.3", "ID.4"],
  },
  {
    brand: "Hyundai",
    models: ["i10", "i20", "i30", "ix20", "ix35", "Tucson", "Kona", "Santa Fe", "Elantra", "Ioniq"],
  },
  {
    brand: "Toyota",
    models: ["Aygo", "Yaris", "Corolla", "Auris", "C-HR", "RAV4", "Avensis", "Camry", "Land Cruiser", "Proace"],
  },
  {
    brand: "Kia",
    models: ["Picanto", "Rio", "Ceed", "Sportage", "Sorento", "Stonic", "Niro", "XCeed", "Venga"],
  },
  {
    brand: "Ford",
    models: ["Fiesta", "Focus", "Mondeo", "Kuga", "Puma", "EcoSport", "S-Max", "Galaxy", "C-Max", "Edge", "Transit", "Tourneo"],
  },
  {
    brand: "Audi",
    models: ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "TT", "e-tron"],
  },
  {
    brand: "BMW",
    models: ["Řada 1", "Řada 2", "Řada 3", "Řada 4", "Řada 5", "Řada 6", "Řada 7", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "i3", "iX"],
  },
  {
    brand: "Mercedes-Benz",
    models: ["Třída A", "Třída B", "Třída C", "Třída E", "Třída S", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "Vito", "Sprinter"],
  },
  {
    brand: "Citroën",
    models: ["C1", "C3", "C3 Aircross", "C4", "C5", "C5 Aircross", "Berlingo", "Jumper", "Jumpy"],
  },
  {
    brand: "Dacia",
    models: ["Sandero", "Logan", "Duster", "Jogger", "Spring", "Dokker", "Lodgy"],
  },
  {
    brand: "Fiat",
    models: ["500", "Panda", "Punto", "Tipo", "500X", "500L", "Doblo", "Ducato"],
  },
  {
    brand: "Honda",
    models: ["Jazz", "Civic", "Accord", "CR-V", "HR-V", "e:Ny1"],
  },
  {
    brand: "Land Rover",
    models: ["Range Rover", "Range Rover Sport", "Range Rover Evoque", "Range Rover Velar", "Discovery", "Discovery Sport", "Defender", "Freelander"],
  },
  {
    brand: "Mazda",
    models: ["2", "3", "6", "CX-3", "CX-30", "CX-5", "CX-60", "MX-5", "MX-30"],
  },
  {
    brand: "Mitsubishi",
    models: ["Space Star", "ASX", "Eclipse Cross", "Outlander", "Pajero", "L200"],
  },
  {
    brand: "Nissan",
    models: ["Micra", "Note", "Juke", "Qashqai", "X-Trail", "Leaf", "Navara"],
  },
  {
    brand: "Opel",
    models: ["Corsa", "Astra", "Insignia", "Mokka", "Crossland", "Grandland", "Zafira", "Meriva", "Vivaro", "Combo"],
  },
  {
    brand: "Peugeot",
    models: ["108", "208", "308", "508", "2008", "3008", "5008", "Partner", "Rifter", "Boxer", "Expert"],
  },
  {
    brand: "Porsche",
    models: ["911", "Cayenne", "Macan", "Panamera", "Taycan", "Boxster", "Cayman"],
  },
  {
    brand: "Renault",
    models: ["Clio", "Mégane", "Captur", "Kadjar", "Austral", "Scénic", "Talisman", "Twingo", "Zoe", "Kangoo", "Trafic", "Master"],
  },
  {
    brand: "Seat",
    models: ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco", "Alhambra", "Toledo"],
  },
  {
    brand: "Suzuki",
    models: ["Swift", "Ignis", "Vitara", "S-Cross", "Jimny", "Baleno"],
  },
  {
    brand: "Tesla",
    models: ["Model 3", "Model Y", "Model S", "Model X"],
  },
  {
    brand: "Volvo",
    models: ["V40", "V60", "V90", "S60", "S90", "XC40", "XC60", "XC90", "C40"],
  },
  {
    brand: "Alfa Romeo",
    models: ["Giulia", "Giulietta", "Stelvio", "Tonale", "147", "156", "159", "166", "Brera", "MiTo", "Spider"],
  },
  {
    brand: "Chevrolet",
    models: ["Aveo", "Cruze", "Captiva", "Trax", "Spark", "Orlando", "Lacetti", "Kalos"],
  },
  {
    brand: "Cupra",
    models: ["Formentor", "Born", "Leon", "Ateca", "Terramar"],
  },
  {
    brand: "DS Automobiles",
    models: ["DS 3", "DS 3 Crossback", "DS 4", "DS 5", "DS 7", "DS 9"],
  },
  {
    brand: "Infiniti",
    models: ["Q30", "Q50", "Q60", "QX30", "QX50", "QX70", "QX80"],
  },
  {
    brand: "Jaguar",
    models: ["XE", "XF", "XJ", "F-Type", "E-Pace", "F-Pace", "I-Pace"],
  },
  {
    brand: "Jeep",
    models: ["Renegade", "Compass", "Cherokee", "Grand Cherokee", "Wrangler", "Avenger"],
  },
  {
    brand: "Lexus",
    models: ["CT", "IS", "ES", "GS", "LS", "NX", "RX", "UX", "LC", "LX", "RC"],
  },
  {
    brand: "MG",
    models: ["3", "4", "5", "ZS", "HS", "Marvel R"],
  },
  {
    brand: "MINI",
    models: ["One", "Cooper", "Cooper S", "Clubman", "Countryman", "Paceman", "Roadster", "Convertible", "Coupe"],
  },
  {
    brand: "Polestar",
    models: ["1", "2", "3", "4"],
  },
  {
    brand: "Saab",
    models: ["9-3", "9-5"],
  },
  {
    brand: "Smart",
    models: ["ForTwo", "ForFour", "#1", "#3"],
  },
  {
    brand: "Subaru",
    models: ["Impreza", "Forester", "Outback", "Legacy", "XV", "Levorg", "BRZ", "WRX"],
  },
  {
    brand: "Bentley",
    models: ["Continental", "Bentayga", "Flying Spur", "Mulsanne"],
  },
  {
    brand: "Ferrari",
    models: ["Roma", "Portofino", "SF90", "F8", "812", "296", "Purosangue"],
  },
  {
    brand: "Lamborghini",
    models: ["Huracán", "Urus", "Revuelto"],
  },
  {
    brand: "Maserati",
    models: ["Ghibli", "Levante", "Quattroporte", "Grecale", "GranTurismo"],
  },
  {
    brand: "Rolls-Royce",
    models: ["Ghost", "Phantom", "Wraith", "Dawn", "Cullinan", "Spectre"],
  },
  {
    brand: "Lada",
    models: ["Niva", "Granta", "Vesta", "2105", "2106", "2107"],
  },
  {
    brand: "Dodge",
    models: ["Challenger", "Charger", "Durango", "Journey", "RAM"],
  },
  {
    brand: "Chrysler",
    models: ["300", "Pacifica", "Voyager"],
  },
  {
    brand: "Cadillac",
    models: ["Escalade", "CT4", "CT5", "XT4", "XT5", "XT6"],
  },
  {
    brand: "BYD",
    models: ["Atto 3", "Han", "Tang", "Seal", "Dolphin", "Seagull"],
  },
  {
    brand: "Lynk & Co",
    models: ["01", "02", "03"],
  },
  {
    brand: "Genesis",
    models: ["G70", "G80", "G90", "GV70", "GV80"],
  },
];

const brandCollator = new Intl.Collator("cs", { sensitivity: "base", numeric: true });

export const carCatalog: CarBrand[] = [...brands].sort((a, b) =>
  brandCollator.compare(a.brand, b.brand)
);
