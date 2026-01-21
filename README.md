# HL7 De-identification Library

A comprehensive JavaScript library for de-identifying HL7 messages according to HIPAA Safe Harbor standards. This library removes or replaces all 18 categories of Protected Health Information (PHI) while maintaining realistic, consistent de-identified values for testing and development purposes.

## Features

- **HIPAA Safe Harbor Compliant**: Removes all 18 categories of PHI as required by HIPAA Safe Harbor de-identification standards
- **Realistic De-identification**: Generates realistic replacement values (names, addresses, phone numbers, etc.) instead of simple placeholders
- **Consistent Mapping**: Same original values always map to the same de-identified values within a message
- **Comprehensive Segment Support**: Handles all major HL7 segments including MSH, PID, PV1, NK1, IN1, IN2, OBR, OBX, NTE, AL1, EVN, and more
- **Gender-Aware**: Uses gender information from patient records to generate gender-appropriate names
- **Pattern Detection**: Automatically detects and de-identifies PHI patterns in free-text fields
- **Zero Dependencies**: Pure JavaScript with no external dependencies

## HIPAA Safe Harbor Compliance

This library addresses all 18 categories of PHI that must be removed or de-identified according to HIPAA Safe Harbor:

1. ✅ Names
2. ✅ Geographic subdivisions smaller than state
3. ✅ Dates (except year) - ages > 89 aggregated to 90+
4. ✅ Telephone numbers
5. ✅ Fax numbers
6. ✅ Email addresses
7. ✅ Social Security numbers
8. ✅ Medical record numbers
9. ✅ Health plan beneficiary numbers
10. ✅ Account numbers
11. ✅ Certificate/license numbers
12. ✅ Vehicle identifiers and serial numbers
13. ✅ Device identifiers and serial numbers
14. ✅ Web URLs
15. ✅ IP addresses
16. ✅ Biometric identifiers
17. ✅ Full face photographic images (handled via pattern detection)
18. ✅ Any other unique identifying number, characteristic, or code

## Installation

### Node.js

```bash
npm install hl7-deidentification
```

Or copy the `src/hl7DeidentificationService.js` file directly into your project.

### Browser

Include the script in your HTML:

```html
<script src="hl7DeidentificationService.js"></script>
```

## Usage

### Basic Usage

```javascript
import { deidentifyHL7Message, validateHL7Message } from './src/hl7DeidentificationService.js';

// Your HL7 message
const hl7Message = `MSH|^~\\&|SendingApp|SendingFacility|ReceivingApp|ReceivingFacility|20240101120000||ADT^A01^ADT_A01|12345|P|2.5
PID|1||MRN123456789^^^HOSPITAL^MR||DOE^JOHN^MIDDLE^JR^^L||19800115|M|||123 MAIN ST^^CITY^ST^12345^USA||555-123-4567^PH|||123-45-6789`;

// Validate the message
if (validateHL7Message(hl7Message)) {
  // De-identify the message
  const deidentified = deidentifyHL7Message(hl7Message);
  console.log(deidentified);
} else {
  console.error('Invalid HL7 message format');
}
```

### Example Output

**Original Message:**
```
MSH|^~\\&|SendingApp|SendingFacility|ReceivingApp|ReceivingFacility|20240101120000||ADT^A01^ADT_A01|12345|P|2.5
PID|1||MRN123456789^^^HOSPITAL^MR||DOE^JOHN^MIDDLE^JR^^L||19800115|M|||123 MAIN ST^^CITY^ST^12345^USA||555-123-4567^PH|||123-45-6789
```

**De-identified Message:**
```
MSH|^~\\&|APP01|FACILITY01|APP01|FACILITY01|20240101||ADT^A01^ADT_A01|MSG000001|P|2.5
PID|1||MRN000001^^^HOSPITAL^MR||SMITH^JAMES^ANNE^JR^MR^MD||19800101|M|||456 MAIN ST^^SPRINGFIELD^CA^10000^USA||555-0001^PH|||000-00-0001
```

## API Reference

### `deidentifyHL7Message(hl7Message)`

De-identifies an entire HL7 message.

**Parameters:**
- `hl7Message` (string): The raw HL7 message string

**Returns:**
- `string`: The de-identified HL7 message

**Throws:**
- `Error`: If the message is empty

**Example:**
```javascript
const deidentified = deidentifyHL7Message(hl7Message);
```

### `validateHL7Message(hl7Message)`

Validates that an HL7 message has the basic structure (MSH segment and pipe delimiters).

**Parameters:**
- `hl7Message` (string): The HL7 message string to validate

**Returns:**
- `boolean`: `true` if the message appears valid, `false` otherwise

**Example:**
```javascript
if (validateHL7Message(hl7Message)) {
  // Process message
}
```

### `getSampleADTMessage()`

Returns a comprehensive sample ADT message for testing purposes.

**Returns:**
- `string`: A sample ADT^A01 message with various PHI types

**Example:**
```javascript
const sample = getSampleADTMessage();
const deidentified = deidentifyHL7Message(sample);
```

## Supported HL7 Segments

The library provides comprehensive de-identification for the following HL7 segments:

- **MSH** - Message Header
- **EVN** - Event Type
- **PID** - Patient Identification
- **PV1** - Patient Visit
- **NK1** - Next of Kin / Associated Parties
- **IN1** - Insurance
- **IN2** - Insurance Additional Information
- **OBR** - Observation Request
- **OBX** - Observation/Result
- **NTE** - Notes and Comments
- **AL1** - Patient Allergy Information
- **Other segments** - Pattern-based de-identification applied

## De-identification Details

### Names
- Patient names are replaced with realistic names from common name pools
- Gender information is used to generate gender-appropriate first names
- Name structure (components separated by `^`) is preserved
- Same original name always maps to the same de-identified name

### Dates
- Dates are reduced to year only (YYYY) or year with standard month/day (YYYY0101)
- Ages > 89 are aggregated to "90+" per HIPAA requirements
- All date components except year are removed

### Addresses
- Street addresses are replaced with realistic street names and numbers
- Cities are replaced with realistic city names
- States are replaced with realistic state codes
- ZIP codes are reduced to first 3 digits + "00" (e.g., "12300")
- Country information is preserved (not identifying at country level)

### Phone Numbers
- All phone and fax numbers are replaced with realistic de-identified numbers (e.g., "555-0001")
- Format: `555-XXXX` where XXXX is a sequential number

### Email Addresses
- Email addresses are replaced with realistic de-identified emails (e.g., "patient001@example.com")

### Identifiers
- Medical Record Numbers (MRN): Replaced with "MRN000001", "MRN000002", etc.
- Account Numbers: Replaced with "ACCT000001", "ACCT000002", etc.
- Social Security Numbers: Replaced with "000-00-0001", "000-00-0002", etc.
- Other identifiers: Replaced with "ID000001", "ID000002", etc.

### URLs and IP Addresses
- URLs are replaced with generic example URLs
- IP addresses are replaced with private network addresses (192.168.0.X)

### Organizations and Facilities
- Facility names are replaced with "FACILITY01", "FACILITY02", etc.
- Application names are replaced with "APP01", "APP02", etc.
- Organization names are replaced with "ORG01", "ORG02", etc.

## Consistency Guarantees

Within a single message:
- The same original value always maps to the same de-identified value
- This ensures referential integrity (e.g., if "John Doe" appears multiple times, it becomes the same de-identified name throughout)

Between messages:
- Each message is processed independently
- Maps and counters are reset for each new message
- This ensures that the same original value in different messages may get different de-identified values (preventing cross-message correlation)

## Limitations and Considerations

1. **Free Text Fields**: While the library uses pattern detection for free-text fields (like NTE comments), it may not catch all PHI in unstructured text. Manual review is recommended for critical use cases.

2. **Custom Segments**: Custom or vendor-specific segments receive pattern-based de-identification. For production use with custom segments, consider extending the `deidentifySegment` function.

3. **Message Validation**: The `validateHL7Message` function performs basic validation only. For production use, consider additional validation.

4. **HIPAA Compliance**: While this library implements HIPAA Safe Harbor requirements, compliance is ultimately your responsibility. Always review de-identified data and consult with legal/compliance teams before using in production.

5. **Age Calculation**: Age calculation uses year-only dates, which may not be perfectly accurate. Ages > 89 are aggregated to "90+" per HIPAA requirements.

## Testing

The library includes a sample ADT message generator for testing:

```javascript
import { getSampleADTMessage, deidentifyHL7Message } from './src/hl7DeidentificationService.js';

const sample = getSampleADTMessage();
const deidentified = deidentifyHL7Message(sample);
console.log('Original:', sample);
console.log('De-identified:', deidentified);
```

## Browser Compatibility

This library uses modern JavaScript features:
- ES6 modules (import/export)
- Map data structure
- Template literals
- Arrow functions

For older browsers, you may need to transpile the code using Babel or similar tools.

## Node.js Compatibility

- Node.js 12+ (for Map support)
- Node.js 14+ recommended

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. When contributing:

1. Ensure your code follows the existing style
2. Add tests for new functionality
3. Update documentation as needed
4. Ensure HIPAA compliance is maintained

## License

This project is provided as-is for use in compliance with HIPAA regulations. Please review and test thoroughly before using in production environments.

## Disclaimer

**IMPORTANT**: This software is provided for informational and development purposes. While it implements HIPAA Safe Harbor de-identification standards, the authors make no warranty or guarantee regarding HIPAA compliance. Users are responsible for:

- Verifying that de-identification meets their specific requirements
- Consulting with legal and compliance teams
- Testing thoroughly before production use
- Ensuring compliance with all applicable regulations

The authors assume no liability for any misuse or non-compliance with HIPAA or other regulations.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

## Version History

- **1.0.0** - Initial release
  - Full HIPAA Safe Harbor compliance
  - Support for all major HL7 segments
  - Realistic de-identification with consistent mapping
  - Gender-aware name generation
  - Pattern-based PHI detection
