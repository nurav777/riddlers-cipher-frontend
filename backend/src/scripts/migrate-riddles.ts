import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";

dotenv.config();

// Riddles data extracted from frontend LevelPlayground.tsx
const RIDDLES_DATA = {
  1: [
    // Shadows of Arkham
    {
      id: 1,
      question:
        "In Arkham's halls where madness dwells, decode this cipher that the Riddler tells: DUKKDP",
      answer: "ARKHAM",
      hint: "Caesar cipher shifted by 3",
    },
    {
      id: 2,
      question:
        "The patients' files are scrambled tight, rearrange to see the light: ELYUMS",
      answer: "ASYLUM",
      hint: "Simple anagram",
    },
    {
      id: 3,
      question: "Security code in binary sight: 01000010 01000001 01010100",
      answer: "BAT",
      hint: "Binary to ASCII",
    },
  ],
  2: [
    // Gotham Underground
    {
      id: 1,
      question:
        "In tunnels deep where trains once ran, solve this riddle if you can: QRWKDP",
      answer: "GOTHAM",
      hint: "Caesar cipher shifted by 3",
    },
    {
      id: 2,
      question:
        "The subway map shows stations three, but backwards they spell mystery: LIAR",
      answer: "RAIL",
      hint: "Reverse the word",
    },
    {
      id: 3,
      question: "Morse code echoes in the night: .... . .-.. .--.",
      answer: "HELP",
      hint: "Morse code translation",
    },
  ],
  3: [
    // Wayne Tower Break-In
    {
      id: 1,
      question:
        "Wayne's empire stands so tall and bright, decode the message hidden from sight: ZDAQH",
      answer: "WAYNE",
      hint: "Caesar cipher shifted by 3",
    },
    {
      id: 2,
      question: "The mainframe password lies within: 20 15 23 5 18",
      answer: "TOWER",
      hint: "A=1, B=2, C=3...",
    },
    {
      id: 3,
      question:
        "Corporate secrets in plain view, rearrange to find what's true: RECESU",
      answer: "SECURE",
      hint: "Anagram of the letters",
    },
  ],
  4: [
    // The Narrows Pursuit
    {
      id: 1,
      question:
        "Through narrow streets the chase begins, decode to see where Riddler wins: QDUUZZV",
      answer: "NARROWS",
      hint: "Caesar cipher shifted by 3",
    },
    {
      id: 2,
      question: "Rain washes clues but not this code: 16-21-18-19-21-9-20",
      answer: "PURSUIT",
      hint: "A=1, B=2, C=3...",
    },
    {
      id: 3,
      question:
        "Time runs out, the trail grows cold, reverse this word to be bold: ECAHC",
      answer: "CHASE",
      hint: "Read it backwards",
    },
  ],
  5: [
    // Final Confrontation (One-word answers)
    {
      id: 1,
      question:
        "As dawn breaks after endless night, what feeling fills the hero’s heart?",
      answer: "HOPE",
      hint: "One word.",
    },
    {
      id: 2,
      question:
        "The city lies silent, its streets in ruin — what emotion clouds the air?",
      answer: "FEAR",
      hint: "One word.",
    },
    {
      id: 3,
      question:
        "When all battles end and peace returns, describe the city's state.",
      answer: "CALM",
      hint: "One word.",
    },
  ],
};

// Level difficulty mapping
const LEVEL_DIFFICULTY_MAP = {
  1: "easy",
  2: "easy",
  3: "medium",
  4: "medium",
  5: "hard",
};

// Riddle type detection based on hint content
function detectRiddleType(hint: string): string {
  const hintLower = hint.toLowerCase();

  if (hintLower.includes("caesar cipher") || hintLower.includes("shifted")) {
    return "cipher";
  } else if (hintLower.includes("anagram") || hintLower.includes("rearrange")) {
    return "anagram";
  } else if (hintLower.includes("binary") || hintLower.includes("ascii")) {
    return "binary";
  } else if (hintLower.includes("morse")) {
    return "morse";
  } else if (hintLower.includes("reverse") || hintLower.includes("backwards")) {
    return "reverse";
  } else if (hintLower.includes("a=1") || hintLower.includes("number")) {
    return "numeric";
  } else {
    return "puzzle";
  }
}

// AWS Configuration
const clientConfig: ConstructorParameters<typeof DynamoDBClient>[0] = {
  region: process.env.AWS_REGION || "us-east-1",
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const dynamoClient = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const RIDDLES_TABLE = process.env.RIDDLES_TABLE_NAME || "GothamRiddles";

async function migrateRiddles() {
  console.log("🦇 Starting Gotham Riddles Migration...");

  try {
    let totalRiddles = 0;

    for (const [levelIdStr, riddles] of Object.entries(RIDDLES_DATA)) {
      const levelId = parseInt(levelIdStr);
      const difficulty =
        LEVEL_DIFFICULTY_MAP[levelId as keyof typeof LEVEL_DIFFICULTY_MAP];

      console.log(
        `📝 Migrating Level ${levelId} (${difficulty}) - ${riddles.length} riddles`
      );

      for (const riddle of riddles) {
        const riddleId = `level-${levelId}-riddle-${riddle.id}`;
        const type = detectRiddleType(riddle.hint);

        const metadata: any = {
          originalId: riddle.id,
          levelTitle: getLevelTitle(levelId),
          hintType: type,
        };

        const riddleItem = {
          riddleId,
          levelId,
          question: riddle.question,
          answer: riddle.answer,
          hint: riddle.hint,
          type,
          difficulty,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          metadata,
        };

        await docClient.send(
          new PutCommand({
            TableName: RIDDLES_TABLE,
            Item: riddleItem,
          })
        );

        console.log(`  ✅ Migrated: ${riddleId} (${type})`);
        totalRiddles++;
      }
    }

    console.log(
      `🎉 Migration completed! Migrated ${totalRiddles} riddles to ${RIDDLES_TABLE}`
    );

    // Display summary
    console.log("\n📊 Migration Summary:");
    console.log("===================");
    for (const [levelIdStr, riddles] of Object.entries(RIDDLES_DATA)) {
      const levelId = parseInt(levelIdStr);
      const difficulty =
        LEVEL_DIFFICULTY_MAP[levelId as keyof typeof LEVEL_DIFFICULTY_MAP];
      console.log(
        `Level ${levelId} (${difficulty}): ${riddles.length} riddles`
      );
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

function getLevelTitle(levelId: number): string {
  const titles = {
    1: "Shadows of Arkham",
    2: "Gotham Underground",
    3: "Wayne Tower Break-In",
    4: "The Narrows Pursuit",
    5: "Final Confrontation",
  };
  return titles[levelId as keyof typeof titles] || `Level ${levelId}`;
}

// Run migration if called directly
if (require.main === module) {
  migrateRiddles()
    .then(() => {
      console.log("✅ Migration script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateRiddles };
