const fs = require("fs");
const path = require("path");

const gradleFile = path.join(
  __dirname,
  "..",
  "node_modules",
  "@react-native-picker",
  "picker",
  "android",
  "build.gradle"
);

if (!fs.existsSync(gradleFile)) {
  process.exit(0);
}

const source = fs.readFileSync(gradleFile, "utf8");
const patched = source.replace(
  'classpath("com.android.tools.build:gradle:7.2.0")',
  'classpath("com.android.tools.build:gradle:8.11.0")'
);

if (patched !== source) {
  fs.writeFileSync(gradleFile, patched);
  console.log("Patched @react-native-picker/picker Android Gradle plugin to 8.11.0");
}
