const expoPreset = require('jest-expo/jest-preset');

// Extend jest-expo's default transformIgnorePatterns so @supabase/* (ESM) also
// gets transformed if a test ever imports a module that pulls it in. The first
// default entry is the node_modules allowlist; we widen it to include @supabase.
const transformIgnorePatterns = (expoPreset.transformIgnorePatterns || []).map((pattern) =>
  pattern.includes('react-native|@react-native')
    ? pattern.replace('react-native|@react-native', 'react-native|@react-native|@supabase')
    : pattern,
);

module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
  transformIgnorePatterns,
};
