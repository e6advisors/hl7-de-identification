/**
 * Example usage of the HL7 De-identification Library
 */

import { 
  deidentifyHL7Message, 
  validateHL7Message, 
  getSampleADTMessage 
} from './src/hl7DeidentificationService.js';

// Example 1: Using the sample message
console.log('=== Example 1: Sample ADT Message ===\n');
const sampleMessage = getSampleADTMessage();
console.log('Original Message:');
console.log(sampleMessage);
console.log('\n---\n');

if (validateHL7Message(sampleMessage)) {
  const deidentified = deidentifyHL7Message(sampleMessage);
  console.log('De-identified Message:');
  console.log(deidentified);
} else {
  console.error('Invalid HL7 message');
}

console.log('\n\n');

// Example 2: Simple custom message
console.log('=== Example 2: Custom Message ===\n');
const customMessage = `MSH|^~\\&|SendingApp|SendingFacility|ReceivingApp|ReceivingFacility|20240101120000||ADT^A01^ADT_A01|12345|P|2.5
PID|1||MRN123456789^^^HOSPITAL^MR||DOE^JOHN^MIDDLE^JR^^L||19800115|M|||123 MAIN ST^^CITY^ST^12345^USA||555-123-4567^PH|||123-45-6789
NK1|1|SMITH^JANE^M^||WIFE|456 SECOND ST^^CITY^ST^67890^USA|555-987-6543^PH`;

console.log('Original Message:');
console.log(customMessage);
console.log('\n---\n');

if (validateHL7Message(customMessage)) {
  const deidentified = deidentifyHL7Message(customMessage);
  console.log('De-identified Message:');
  console.log(deidentified);
} else {
  console.error('Invalid HL7 message');
}

console.log('\n\n');

// Example 3: Validation
console.log('=== Example 3: Validation ===\n');
const invalidMessage = 'This is not an HL7 message';
console.log(`Message: "${invalidMessage}"`);
console.log(`Valid: ${validateHL7Message(invalidMessage)}`);

const validMessage = 'MSH|^~\\&|App|Facility|||20240101||ADT^A01|123|P|2.5';
console.log(`\nMessage: "${validMessage}"`);
console.log(`Valid: ${validateHL7Message(validMessage)}`);
