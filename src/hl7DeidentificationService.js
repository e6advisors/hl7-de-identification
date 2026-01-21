/**
 * HL7 De-identification Service
 * 
 * This service de-identifies HL7 messages according to HIPAA Safe Harbor standards.
 * It removes or replaces all 18 categories of Protected Health Information (PHI).
 * 
 * HIPAA Safe Harbor requires removal of:
 * 1. Names
 * 2. Geographic subdivisions smaller than state
 * 3. Dates (except year) - ages > 89 must be aggregated to 90+
 * 4. Telephone numbers
 * 5. Fax numbers
 * 6. Email addresses
 * 7. Social Security numbers
 * 8. Medical record numbers
 * 9. Health plan beneficiary numbers
 * 10. Account numbers
 * 11. Certificate/license numbers
 * 12. Vehicle identifiers and serial numbers
 * 13. Device identifiers and serial numbers
 * 14. Web URLs
 * 15. IP addresses
 * 16. Biometric identifiers
 * 17. Full face photographic images
 * 18. Any other unique identifying number, characteristic, or code
 */

// Mapping stores to ensure consistent de-identification (same original -> same de-identified)
const deidentificationMaps = {
  names: new Map(),
  phones: new Map(),
  emails: new Map(),
  identifiers: new Map(),
  ssns: new Map(),
  urls: new Map(),
  ips: new Map(),
  devices: new Map(),
  vehicles: new Map(),
  biometrics: new Map(),
  facilities: new Map(),
  applications: new Map(),
  organizations: new Map(),
  lastNames: new Map(),
  firstNames: new Map(),
  middleNames: new Map(),
  suffixes: new Map(),
  prefixes: new Map(),
  degrees: new Map(),
  streets: new Map(),
  cities: new Map(),
  states: new Map(),
  zips: new Map(),
}

// Pools of realistic data for generating de-identified values
const realisticData = {
  lastNames: ['SMITH', 'JOHNSON', 'WILLIAMS', 'BROWN', 'JONES', 'GARCIA', 'MILLER', 'DAVIS', 'RODRIGUEZ', 'MARTINEZ', 'HERNANDEZ', 'LOPEZ', 'WILSON', 'ANDERSON', 'THOMAS', 'TAYLOR', 'MOORE', 'JACKSON', 'MARTIN', 'LEE', 'THOMPSON', 'WHITE', 'HARRIS', 'SANCHEZ', 'CLARK', 'RAMIREZ', 'LEWIS', 'ROBINSON', 'WALKER', 'YOUNG', 'ALLEN', 'KING', 'WRIGHT', 'SCOTT', 'TORRES', 'NGUYEN', 'HILL', 'FLORES', 'GREEN', 'ADAMS', 'NELSON', 'BAKER', 'HALL', 'RIVERA', 'CAMPBELL', 'MITCHELL', 'CARTER', 'ROBERTS'],
  firstNamesMale: ['JAMES', 'JOHN', 'ROBERT', 'MICHAEL', 'WILLIAM', 'DAVID', 'RICHARD', 'JOSEPH', 'THOMAS', 'CHARLES', 'CHRISTOPHER', 'DANIEL', 'MATTHEW', 'ANTHONY', 'MARK', 'DONALD', 'STEVEN', 'PAUL', 'ANDREW', 'JOSHUA', 'KENNETH', 'KEVIN', 'BRIAN', 'GEORGE', 'EDWARD', 'RONALD', 'TIMOTHY', 'JASON', 'JEFFREY', 'RYAN', 'JACOB', 'GARY', 'NICHOLAS', 'ERIC', 'JONATHAN', 'STEPHEN', 'LARRY', 'JUSTIN', 'SCOTT', 'BRANDON', 'BENJAMIN', 'SAMUEL', 'FRANK', 'GREGORY', 'RAYMOND', 'ALEXANDER', 'PATRICK', 'JACK', 'DENNIS', 'JERRY'],
  firstNamesFemale: ['MARY', 'PATRICIA', 'JENNIFER', 'LINDA', 'ELIZABETH', 'BARBARA', 'SUSAN', 'JESSICA', 'SARAH', 'KAREN', 'NANCY', 'LISA', 'BETTY', 'MARGARET', 'SANDRA', 'ASHLEY', 'KIMBERLY', 'EMILY', 'DONNA', 'MICHELLE', 'DOROTHY', 'CAROL', 'AMANDA', 'MELISSA', 'DEBORAH', 'STEPHANIE', 'REBECCA', 'SHARON', 'LAURA', 'CYNTHIA', 'KATHLEEN', 'AMY', 'SHIRLEY', 'ANGELA', 'HELEN', 'ANNA', 'BRENDA', 'PAMELA', 'NICOLE', 'SAMANTHA', 'KATHERINE', 'EMMA', 'CHRISTINE', 'DEBRA', 'RACHEL', 'CAROLYN', 'JANET', 'VIRGINIA', 'MARIA', 'HEATHER'],
  middleNames: ['ANNE', 'MARIE', 'LYNN', 'LEE', 'ROSE', 'JANE', 'GRACE', 'MAE', 'ELIZABETH', 'ANN', 'KAY', 'JO', 'LOUISE', 'JEAN', 'CLAIRE', 'FAITH', 'HOPE', 'JOY', 'PAUL', 'JAMES', 'MICHAEL', 'JOHN', 'ROBERT', 'WILLIAM', 'DAVID', 'RICHARD', 'THOMAS', 'JOSEPH', 'CHARLES', 'DANIEL'],
  suffixes: ['JR', 'SR', 'II', 'III', 'IV', 'V', 'ESQ', 'MD', 'PHD', 'RN', 'CPA'],
  prefixes: ['MR', 'MRS', 'MS', 'DR', 'PROF', 'REV', 'HON'],
  degrees: ['MD', 'DO', 'DDS', 'DMD', 'DVM', 'PHD', 'RN', 'BSN', 'MSN', 'NP', 'PA', 'JD', 'MBA', 'BS', 'BA', 'MA', 'MS'],
  streetNames: ['MAIN', 'OAK', 'PARK', 'ELM', 'PINE', 'MAPLE', 'CENTER', 'FIRST', 'SECOND', 'THIRD', 'WASHINGTON', 'LINCOLN', 'JEFFERSON', 'MADISON', 'CHURCH', 'BROADWAY', 'CHESTNUT', 'WALNUT', 'CREEK', 'RIVER', 'LAKE', 'HILL', 'VALLEY', 'SPRING', 'SUMMIT', 'VIEW', 'SUNSET', 'SUNRISE', 'RIDGE', 'MEADOW'],
  streetTypes: ['ST', 'AVE', 'BLVD', 'RD', 'DR', 'LN', 'CT', 'CIR', 'PL', 'WAY', 'PKWY', 'TER', 'TRL'],
  cities: ['SPRINGFIELD', 'FRANKLIN', 'GEORGETOWN', 'MADISON', 'CLAYTON', 'ARLINGTON', 'RIVERSIDE', 'FAIRVIEW', 'GREENWOOD', 'OAKWOOD', 'MAPLEWOOD', 'CEDARVILLE', 'HILLSBORO', 'WESTFIELD', 'EASTWOOD', 'NORTHBROOK', 'SOUTHGATE', 'CENTRAL', 'MIDDLETON', 'HIGHLAND', 'LOWELL', 'WESTON', 'EASTON', 'NORTHFIELD', 'SOUTHPORT'],
  states: ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
}

// Store gender information for current patient (extracted from PID-8)
let currentPatientGender = null

// Counters for generating sequential realistic values
const counters = {
  patient: 0,
  doctor: 0,
  phone: 0,
  email: 0,
  mrn: 0,
  account: 0,
  ssn: 0,
  url: 0,
  ip: 0,
  device: 0,
  vehicle: 0,
  biometric: 0,
  facility: 0,
  application: 0,
  organization: 0,
  lastNameIndex: 0,
  firstNameIndex: 0,
  middleNameIndex: 0,
  suffixIndex: 0,
  prefixIndex: 0,
  degreeIndex: 0,
  streetIndex: 0,
  cityIndex: 0,
  stateIndex: 0,
  zipIndex: 0,
}

/**
 * Resets all de-identification maps and counters (useful for testing)
 */
function resetDeidentificationMaps() {
  Object.keys(deidentificationMaps).forEach(key => {
    deidentificationMaps[key].clear()
  })
  Object.keys(counters).forEach(key => {
    counters[key] = 0
  })
  currentPatientGender = null
}

/**
 * Generates a deterministic hash from a string for consistent mapping
 * @param {string} str - Input string
 * @returns {number} Hash value
 */
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Gets a consistent realistic last name for a given original name
 * @param {string} originalName - Original last name
 * @returns {string} Realistic de-identified last name
 */
function getRealisticLastName(originalName) {
  if (!originalName || originalName.trim() === '') return ''
  
  if (deidentificationMaps.lastNames.has(originalName)) {
    return deidentificationMaps.lastNames.get(originalName)
  }
  
  const hash = hashString(originalName)
  const index = hash % realisticData.lastNames.length
  const lastName = realisticData.lastNames[index]
  deidentificationMaps.lastNames.set(originalName, lastName)
  return lastName
}

/**
 * Gets a consistent realistic first name for a given original name
 * @param {string} originalName - Original first name
 * @param {string} gender - Gender ('M', 'F', 'O', 'U', or null)
 * @returns {string} Realistic de-identified first name
 */
function getRealisticFirstName(originalName, gender = null) {
  if (!originalName || originalName.trim() === '') return ''
  
  // Use gender-specific key for mapping to ensure gender-appropriate names
  const mapKey = gender ? `${originalName}_${gender}` : originalName
  
  if (deidentificationMaps.firstNames.has(mapKey)) {
    return deidentificationMaps.firstNames.get(mapKey)
  }
  
  // Determine which name pool to use based on gender
  let namePool = realisticData.firstNamesMale // Default to male names
  if (gender === 'F' || gender === 'f') {
    namePool = realisticData.firstNamesFemale
  } else if (gender === null || gender === 'U' || gender === 'u' || gender === 'O' || gender === 'o') {
    // If gender is unknown/other/null, use current patient gender if available
    if (currentPatientGender === 'F' || currentPatientGender === 'f') {
      namePool = realisticData.firstNamesFemale
    } else {
      namePool = realisticData.firstNamesMale
    }
  }
  
  const hash = hashString(originalName)
  const index = hash % namePool.length
  const firstName = namePool[index]
  deidentificationMaps.firstNames.set(mapKey, firstName)
  return firstName
}

/**
 * Gets a consistent realistic middle name for a given original name
 * @param {string} originalName - Original middle name
 * @returns {string} Realistic de-identified middle name
 */
function getRealisticMiddleName(originalName) {
  if (!originalName || originalName.trim() === '') return ''
  
  if (deidentificationMaps.middleNames.has(originalName)) {
    return deidentificationMaps.middleNames.get(originalName)
  }
  
  const hash = hashString(originalName)
  const index = hash % realisticData.middleNames.length
  const middleName = realisticData.middleNames[index]
  deidentificationMaps.middleNames.set(originalName, middleName)
  return middleName
}

/**
 * Gets a consistent realistic suffix for a given original suffix
 * @param {string} originalSuffix - Original suffix
 * @returns {string} Realistic de-identified suffix
 */
function getRealisticSuffix(originalSuffix) {
  if (!originalSuffix || originalSuffix.trim() === '') return ''
  
  if (deidentificationMaps.suffixes.has(originalSuffix)) {
    return deidentificationMaps.suffixes.get(originalSuffix)
  }
  
  // If original suffix is a common one, map it to another common one
  const commonSuffixes = ['JR', 'SR', 'II', 'III', 'IV', 'V']
  if (commonSuffixes.includes(originalSuffix.toUpperCase())) {
    const hash = hashString(originalSuffix)
    const index = hash % commonSuffixes.length
    const suffix = commonSuffixes[index]
    deidentificationMaps.suffixes.set(originalSuffix, suffix)
    return suffix
  }
  
  // For other suffixes, use a generic mapping
  const hash = hashString(originalSuffix)
  const index = hash % realisticData.suffixes.length
  const suffix = realisticData.suffixes[index]
  deidentificationMaps.suffixes.set(originalSuffix, suffix)
  return suffix
}

/**
 * Gets a consistent realistic prefix for a given original prefix
 * @param {string} originalPrefix - Original prefix
 * @param {string} gender - Gender ('M', 'F', 'O', 'U', or null) for gender-appropriate prefix
 * @returns {string} Realistic de-identified prefix
 */
function getRealisticPrefix(originalPrefix, gender = null) {
  if (!originalPrefix || originalPrefix.trim() === '') return ''
  
  // Use gender-specific key for mapping
  const mapKey = gender ? `${originalPrefix}_${gender}` : originalPrefix
  
  if (deidentificationMaps.prefixes.has(mapKey)) {
    return deidentificationMaps.prefixes.get(mapKey)
  }
  
  // Gender-appropriate prefixes
  const malePrefixes = ['MR', 'DR', 'PROF', 'REV', 'HON']
  const femalePrefixes = ['MRS', 'MS', 'DR', 'PROF', 'REV', 'HON']
  
  let prefixPool = realisticData.prefixes // Default
  if (gender === 'M' || gender === 'm') {
    prefixPool = malePrefixes
  } else if (gender === 'F' || gender === 'f') {
    prefixPool = femalePrefixes
  } else if (gender === null || gender === 'U' || gender === 'u' || gender === 'O' || gender === 'o') {
    // If gender is unknown/other/null, use current patient gender if available
    if (currentPatientGender === 'F' || currentPatientGender === 'f') {
      prefixPool = femalePrefixes
    } else if (currentPatientGender === 'M' || currentPatientGender === 'm') {
      prefixPool = malePrefixes
    }
  }
  
  const hash = hashString(originalPrefix)
  const index = hash % prefixPool.length
  const prefix = prefixPool[index]
  deidentificationMaps.prefixes.set(mapKey, prefix)
  return prefix
}

/**
 * Gets a consistent realistic degree for a given original degree
 * @param {string} originalDegree - Original degree
 * @returns {string} Realistic de-identified degree
 */
function getRealisticDegree(originalDegree) {
  if (!originalDegree || originalDegree.trim() === '') return ''
  
  if (deidentificationMaps.degrees.has(originalDegree)) {
    return deidentificationMaps.degrees.get(originalDegree)
  }
  
  const hash = hashString(originalDegree)
  const index = hash % realisticData.degrees.length
  const degree = realisticData.degrees[index]
  deidentificationMaps.degrees.set(originalDegree, degree)
  return degree
}

/**
 * Gets a consistent realistic street name for a given original street
 * @param {string} originalStreet - Original street address
 * @returns {string} Realistic de-identified street address
 */
function getRealisticStreet(originalStreet) {
  if (!originalStreet || originalStreet.trim() === '') return ''
  
  if (deidentificationMaps.streets.has(originalStreet)) {
    return deidentificationMaps.streets.get(originalStreet)
  }
  
  // Extract number if present (e.g., "123 MAIN ST" -> "123")
  const numberMatch = originalStreet.match(/^(\d+)/)
  const streetNumber = numberMatch ? numberMatch[1] : ''
  
  // Generate new street number (keep similar magnitude)
  let newNumber = ''
  if (streetNumber) {
    const hash = hashString(originalStreet)
    // Generate a number between 100-9999 based on hash
    newNumber = ((hash % 9900) + 100).toString()
  }
  
  // Get realistic street name and type
  const hash = hashString(originalStreet)
  const streetNameIndex = hash % realisticData.streetNames.length
  const streetTypeIndex = (hash * 7) % realisticData.streetTypes.length
  
  const streetName = realisticData.streetNames[streetNameIndex]
  const streetType = realisticData.streetTypes[streetTypeIndex]
  
  const newStreet = newNumber ? `${newNumber} ${streetName} ${streetType}` : `${streetName} ${streetType}`
  deidentificationMaps.streets.set(originalStreet, newStreet)
  return newStreet
}

/**
 * Gets a consistent realistic city name for a given original city
 * @param {string} originalCity - Original city name
 * @returns {string} Realistic de-identified city name
 */
function getRealisticCity(originalCity) {
  if (!originalCity || originalCity.trim() === '') return ''
  
  if (deidentificationMaps.cities.has(originalCity)) {
    return deidentificationMaps.cities.get(originalCity)
  }
  
  const hash = hashString(originalCity)
  const index = hash % realisticData.cities.length
  const city = realisticData.cities[index]
  deidentificationMaps.cities.set(originalCity, city)
  return city
}

/**
 * Gets a consistent realistic state for a given original state
 * @param {string} originalState - Original state code
 * @returns {string} Realistic de-identified state code
 */
function getRealisticState(originalState) {
  if (!originalState || originalState.trim() === '') return ''
  
  if (deidentificationMaps.states.has(originalState)) {
    return deidentificationMaps.states.get(originalState)
  }
  
  const hash = hashString(originalState)
  const index = hash % realisticData.states.length
  const state = realisticData.states[index]
  deidentificationMaps.states.set(originalState, state)
  return state
}

/**
 * Gets a consistent realistic ZIP code for a given original ZIP
 * @param {string} originalZip - Original ZIP code
 * @returns {string} Realistic de-identified ZIP code (first 3 digits + 00)
 */
function getRealisticZip(originalZip) {
  if (!originalZip || originalZip.trim() === '') return '00000'
  
  if (deidentificationMaps.zips.has(originalZip)) {
    return deidentificationMaps.zips.get(originalZip)
  }
  
  // Extract first 3 digits from original ZIP
  const zipMatch = originalZip.match(/^(\d{3})/)
  if (zipMatch) {
    const firstThree = zipMatch[1]
    // Generate a realistic 3-digit prefix (000-999, but avoid obviously fake ones)
    const hash = hashString(originalZip)
    // Use hash to pick from realistic ZIP prefixes (100-999)
    const prefix = ((hash % 900) + 100).toString()
    const newZip = prefix + '00'
    deidentificationMaps.zips.set(originalZip, newZip)
    return newZip
  }
  
  // Default if no valid ZIP found
  const defaultZip = '00000'
  deidentificationMaps.zips.set(originalZip, defaultZip)
  return defaultZip
}

/**
 * Generates a realistic de-identified name
 * @param {string} originalValue - Original name value
 * @param {string} type - Type of name (e.g., 'patient', 'doctor', 'generic')
 * @returns {string} Realistic de-identified name
 */
function generateRealisticName(originalValue, type = 'patient') {
  if (!originalValue || originalValue.trim() === '') return ''
  
  // Use mapping to ensure consistency
  if (deidentificationMaps.names.has(originalValue)) {
    return deidentificationMaps.names.get(originalValue)
  }
  
  // Generate realistic name based on type
  let prefix = 'PATIENT'
  if (type === 'doctor' || type === 'provider') {
    prefix = 'DOCTOR'
    counters.doctor++
    const num = counters.doctor.toString().padStart(3, '0')
    const name = `${prefix}${num}`
    deidentificationMaps.names.set(originalValue, name)
    return name
  } else if (type === 'nextofkin' || type === 'kin') {
    prefix = 'KIN'
  } else if (type === 'contact') {
    prefix = 'CONTACT'
  }
  
  counters.patient++
  const num = counters.patient.toString().padStart(3, '0')
  const name = `${prefix}${num}`
  deidentificationMaps.names.set(originalValue, name)
  return name
}

/**
 * Generates a realistic de-identified phone number
 * @param {string} originalValue - Original phone value
 * @returns {string} Realistic de-identified phone (e.g., "555-0001")
 */
function generateRealisticPhone(originalValue) {
  if (!originalValue || originalValue.trim() === '') return ''
  
  if (deidentificationMaps.phones.has(originalValue)) {
    return deidentificationMaps.phones.get(originalValue)
  }
  
  counters.phone++
  const num = counters.phone.toString().padStart(4, '0')
  const phone = `555-${num}`
  deidentificationMaps.phones.set(originalValue, phone)
  return phone
}

/**
 * Generates a realistic de-identified email address
 * @param {string} originalValue - Original email value
 * @returns {string} Realistic de-identified email (e.g., "patient001@example.com")
 */
function generateRealisticEmail(originalValue) {
  if (!originalValue || originalValue.trim() === '') return ''
  
  if (deidentificationMaps.emails.has(originalValue)) {
    return deidentificationMaps.emails.get(originalValue)
  }
  
  counters.email++
  const num = counters.email.toString().padStart(3, '0')
  const email = `patient${num}@example.com`
  deidentificationMaps.emails.set(originalValue, email)
  return email
}

/**
 * Generates a realistic de-identified identifier
 * @param {string} originalValue - Original identifier value
 * @param {string} type - Type of identifier (e.g., 'mrn', 'account', 'generic')
 * @returns {string} Realistic de-identified identifier
 */
function generateRealisticIdentifier(originalValue, type = 'generic') {
  if (!originalValue || originalValue.trim() === '') return ''
  
  if (deidentificationMaps.identifiers.has(originalValue)) {
    return deidentificationMaps.identifiers.get(originalValue)
  }
  
  let prefix = 'ID'
  let counter = 0
  
  if (type === 'mrn' || originalValue.toLowerCase().includes('mrn')) {
    prefix = 'MRN'
    counters.mrn++
    counter = counters.mrn
  } else if (type === 'account' || originalValue.toLowerCase().includes('account')) {
    prefix = 'ACCT'
    counters.account++
    counter = counters.account
  } else {
    counters.mrn++
    counter = counters.mrn
    prefix = 'ID'
  }
  
  const num = counter.toString().padStart(6, '0')
  const identifier = `${prefix}${num}`
  deidentificationMaps.identifiers.set(originalValue, identifier)
  return identifier
}

/**
 * Generates a realistic de-identified SSN
 * @param {string} originalValue - Original SSN value
 * @returns {string} Realistic de-identified SSN (e.g., "000-00-0001")
 */
function generateRealisticSSN(originalValue) {
  if (!originalValue || originalValue.trim() === '') return ''
  
  if (deidentificationMaps.ssns.has(originalValue)) {
    return deidentificationMaps.ssns.get(originalValue)
  }
  
  counters.ssn++
  const num = counters.ssn.toString().padStart(4, '0')
  const ssn = `000-00-${num}`
  deidentificationMaps.ssns.set(originalValue, ssn)
  return ssn
}

/**
 * Generates a realistic de-identified URL
 * @param {string} originalValue - Original URL value
 * @returns {string} Realistic de-identified URL
 */
function generateRealisticURL(originalValue) {
  if (!originalValue || originalValue.trim() === '') return ''
  
  if (deidentificationMaps.urls.has(originalValue)) {
    return deidentificationMaps.urls.get(originalValue)
  }
  
  counters.url++
  const num = counters.url.toString().padStart(3, '0')
  const url = `https://example.com/resource${num}`
  deidentificationMaps.urls.set(originalValue, url)
  return url
}

/**
 * Generates a realistic de-identified IP address
 * @param {string} originalValue - Original IP value
 * @returns {string} Realistic de-identified IP (e.g., "192.168.0.1")
 */
function generateRealisticIP(originalValue) {
  if (!originalValue || originalValue.trim() === '') return ''
  
  if (deidentificationMaps.ips.has(originalValue)) {
    return deidentificationMaps.ips.get(originalValue)
  }
  
  counters.ip++
  const ip = `192.168.0.${counters.ip}`
  deidentificationMaps.ips.set(originalValue, ip)
  return ip
}

/**
 * Generates a realistic de-identified device identifier
 * @param {string} originalValue - Original device value
 * @returns {string} Realistic de-identified device ID
 */
function generateRealisticDevice(originalValue) {
  if (!originalValue || originalValue.trim() === '') return ''
  
  if (deidentificationMaps.devices.has(originalValue)) {
    return deidentificationMaps.devices.get(originalValue)
  }
  
  counters.device++
  const num = counters.device.toString().padStart(6, '0')
  const device = `DEV${num}`
  deidentificationMaps.devices.set(originalValue, device)
  return device
}

/**
 * Generates a realistic de-identified vehicle identifier
 * @param {string} originalValue - Original vehicle value
 * @returns {string} Realistic de-identified vehicle ID
 */
function generateRealisticVehicle(originalValue) {
  if (!originalValue || originalValue.trim() === '') return ''
  
  if (deidentificationMaps.vehicles.has(originalValue)) {
    return deidentificationMaps.vehicles.get(originalValue)
  }
  
  counters.vehicle++
  const num = counters.vehicle.toString().padStart(6, '0')
  const vehicle = `VIN${num}`
  deidentificationMaps.vehicles.set(originalValue, vehicle)
  return vehicle
}

/**
 * Generates a realistic de-identified biometric identifier
 * @param {string} originalValue - Original biometric value
 * @returns {string} Realistic de-identified biometric ID
 */
function generateRealisticBiometric(originalValue) {
  if (!originalValue || originalValue.trim() === '') return ''
  
  if (deidentificationMaps.biometrics.has(originalValue)) {
    return deidentificationMaps.biometrics.get(originalValue)
  }
  
  counters.biometric++
  const num = counters.biometric.toString().padStart(6, '0')
  const biometric = `BIO${num}`
  deidentificationMaps.biometrics.set(originalValue, biometric)
  return biometric
}

/**
 * Generates a realistic de-identified facility name
 * @param {string} originalValue - Original facility value
 * @returns {string} Realistic de-identified facility
 */
function generateRealisticFacility(originalValue) {
  if (!originalValue || originalValue.trim() === '') return ''
  
  if (deidentificationMaps.facilities.has(originalValue)) {
    return deidentificationMaps.facilities.get(originalValue)
  }
  
  counters.facility++
  const num = counters.facility.toString().padStart(2, '0')
  const facility = `FACILITY${num}`
  deidentificationMaps.facilities.set(originalValue, facility)
  return facility
}

/**
 * Generates a realistic de-identified application name
 * @param {string} originalValue - Original application value
 * @returns {string} Realistic de-identified application
 */
function generateRealisticApplication(originalValue) {
  if (!originalValue || originalValue.trim() === '') return ''
  
  if (deidentificationMaps.applications.has(originalValue)) {
    return deidentificationMaps.applications.get(originalValue)
  }
  
  counters.application++
  const num = counters.application.toString().padStart(2, '0')
  const application = `APP${num}`
  deidentificationMaps.applications.set(originalValue, application)
  return application
}

/**
 * Generates a realistic de-identified organization name
 * @param {string} originalValue - Original organization value
 * @returns {string} Realistic de-identified organization
 */
function generateRealisticOrganization(originalValue) {
  if (!originalValue || originalValue.trim() === '') return ''
  
  if (deidentificationMaps.organizations.has(originalValue)) {
    return deidentificationMaps.organizations.get(originalValue)
  }
  
  counters.organization++
  const num = counters.organization.toString().padStart(2, '0')
  const organization = `ORG${num}`
  deidentificationMaps.organizations.set(originalValue, organization)
  return organization
}

/**
 * Removes or replaces dates, keeping only the year
 * Handles various HL7 date formats: YYYY, YYYYMM, YYYYMMDD, YYYYMMDDHH, YYYYMMDDHHMM, YYYYMMDDHHMMSS
 * For realistic de-identification, uses a standard format: YYYY0101 (year + 01/01)
 * @param {string} dateStr - Date string in various formats
 * @returns {string} Year with standard month/day (YYYY0101) or year only if already just year
 */
function deidentifyDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return ''
  
  // Handle component-separated dates (e.g., in repeating fields)
  const trimmed = dateStr.trim()
  
  // Try to extract year from common HL7 date formats
  // Format: YYYY[MM[DD[HH[MM[SS[.SSSS]]]]]]
  const yearMatch = trimmed.match(/^(\d{4})/)
  if (yearMatch) {
    const year = yearMatch[1]
    // If the original was just a year (YYYY), return it as-is
    if (trimmed.length === 4) {
      return year
    }
    // Otherwise, return year with standard month/day for consistency
    return `${year}0101`
  }
  
  // Try ISO format (YYYY-MM-DD)
  const isoMatch = trimmed.match(/^(\d{4})-\d{2}-\d{2}/)
  if (isoMatch) {
    return `${isoMatch[1]}0101`
  }
  
  // If no year found, return current year with standard date
  const currentYear = new Date().getFullYear()
  return `${currentYear}0101`
}

/**
 * Calculates age from birth date and current date, applying HIPAA rule for ages > 89
 * @param {string} birthDateStr - Birth date in HL7 format
 * @param {string} currentDateStr - Current date in HL7 format (optional, defaults to now)
 * @returns {string} Age or "90+" if age > 89
 */
function deidentifyAge(birthDateStr, currentDateStr = null) {
  if (!birthDateStr || birthDateStr.trim() === '') return ''
  
  // Extract year from birth date
  const birthYearMatch = birthDateStr.match(/^(\d{4})/)
  if (!birthYearMatch) return '50' // Default realistic age
  
  const birthYear = parseInt(birthYearMatch[1])
  const currentYear = currentDateStr 
    ? parseInt(currentDateStr.match(/^(\d{4})/)?.[1] || new Date().getFullYear())
    : new Date().getFullYear()
  
  const age = currentYear - birthYear
  
  // HIPAA Safe Harbor: ages > 89 must be aggregated to "90+"
  if (age > 89) {
    return '90+'
  }
  
  // Ensure age is realistic (not negative)
  if (age < 0) {
    return '50' // Default realistic age
  }
  
  return age.toString()
}

/**
 * Removes phone numbers, fax numbers, and replaces with realistic de-identified values
 * Handles various formats: (555) 123-4567, 555-123-4567, 5551234567, +1-555-123-4567
 * @param {string} phoneStr - Phone number string
 * @param {boolean} forceDeidentify - If true, always de-identify even if pattern doesn't match
 * @returns {string} Realistic de-identified phone number
 */
function deidentifyPhone(phoneStr, forceDeidentify = false) {
  if (!phoneStr || phoneStr.trim() === '') return ''
  
  // If forceDeidentify is true (called from known PHI field), always de-identify
  if (forceDeidentify) {
    return generateRealisticPhone(phoneStr)
  }
  
  // Check if it looks like a phone number (contains digits and common phone chars)
  const phonePattern = /[\d\-\(\)\s\+\.]+/
  if (phonePattern.test(phoneStr) && phoneStr.replace(/\D/g, '').length >= 7) {
    return generateRealisticPhone(phoneStr)
  }
  
  // If it doesn't match pattern and not forced, return original
  return phoneStr
}

/**
 * Removes email addresses and replaces with realistic de-identified values
 * @param {string} emailStr - Email address string
 * @param {boolean} forceDeidentify - If true, always de-identify even if pattern doesn't match
 * @returns {string} Realistic de-identified email
 */
function deidentifyEmail(emailStr, forceDeidentify = false) {
  if (!emailStr || emailStr.trim() === '') return ''
  
  // If forceDeidentify is true (called from known PHI field), always de-identify
  if (forceDeidentify) {
    return generateRealisticEmail(emailStr)
  }
  
  // Email pattern: user@domain
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i
  if (emailPattern.test(emailStr.trim())) {
    return generateRealisticEmail(emailStr)
  }
  
  // If it doesn't match pattern and not forced, return original
  return emailStr
}

/**
 * Removes names and replaces with realistic de-identified values
 * Handles HL7 name format: Family^Given^Middle^Suffix^Prefix^Degree^NameTypeCode
 * @param {string} nameStr - Name string (may be component-separated with ^)
 * @param {string} type - Type of name (e.g., 'patient', 'doctor', 'nextofkin')
 * @param {string} gender - Gender ('M', 'F', 'O', 'U', or null) - used for patient names
 * @returns {string} Realistic de-identified name preserving structure with realistic components
 */
function deidentifyName(nameStr, type = 'patient', gender = null) {
  if (!nameStr || nameStr.trim() === '') return ''
  
  // For patient names, use provided gender or current patient gender
  const nameGender = (type === 'patient' && gender) ? gender : (type === 'patient' ? currentPatientGender : null)
  
  // If name contains component separator (^), replace each component with realistic data
  if (nameStr.includes('^')) {
    const components = nameStr.split('^')
    const deidentifiedComponents = []
    
    // Component 0: Family Name (Last Name)
    if (components[0] && components[0].trim() !== '') {
      deidentifiedComponents[0] = getRealisticLastName(components[0])
    } else {
      deidentifiedComponents[0] = ''
    }
    
    // Component 1: Given Name (First Name) - use gender for patient names
    if (components.length > 1 && components[1] && components[1].trim() !== '') {
      deidentifiedComponents[1] = getRealisticFirstName(components[1], nameGender)
    } else {
      deidentifiedComponents[1] = ''
    }
    
    // Component 2: Middle Name
    if (components.length > 2 && components[2] && components[2].trim() !== '') {
      deidentifiedComponents[2] = getRealisticMiddleName(components[2])
    } else {
      deidentifiedComponents[2] = ''
    }
    
    // Component 3: Suffix (JR, SR, II, III, etc.)
    if (components.length > 3 && components[3] && components[3].trim() !== '') {
      deidentifiedComponents[3] = getRealisticSuffix(components[3])
    } else {
      deidentifiedComponents[3] = ''
    }
    
    // Component 4: Prefix (MR, MRS, DR, etc.) - use gender for gender-appropriate prefix
    if (components.length > 4 && components[4] && components[4].trim() !== '') {
      deidentifiedComponents[4] = getRealisticPrefix(components[4], nameGender)
    } else {
      deidentifiedComponents[4] = ''
    }
    
    // Component 5: Degree (MD, PHD, RN, etc.)
    if (components.length > 5 && components[5] && components[5].trim() !== '') {
      deidentifiedComponents[5] = getRealisticDegree(components[5])
    } else {
      deidentifiedComponents[5] = ''
    }
    
    // Component 6+: Name Type Code and other extensions - preserve if present but don't add new ones
    for (let i = 6; i < components.length; i++) {
      // Keep name type codes and other non-PHI extensions as-is
      deidentifiedComponents[i] = components[i] || ''
    }
    
    // Ensure we have at least as many components as the original
    while (deidentifiedComponents.length < components.length) {
      deidentifiedComponents.push('')
    }
    
    return deidentifiedComponents.join('^')
  }
  
  // If no component separator, treat as a single name (likely last name)
  return getRealisticLastName(nameStr)
}

/**
 * Removes addresses and replaces with realistic de-identified values
 * HIPAA Safe Harbor: ZIP codes must be reduced to first 3 digits if population < 20,000
 * Cities and streets are geographic subdivisions smaller than state and must be replaced
 * HL7 address format: Street^OtherDesignation^City^State^ZIP^Country^AddressType^OtherGeographic
 * @param {string} addressStr - Address string (component-separated)
 * @returns {string} Realistic de-identified address with realistic street, city, state, and ZIP
 */
function deidentifyAddress(addressStr) {
  if (!addressStr || addressStr.trim() === '') return ''
  
  const components = addressStr.split('^')
  const result = []
  
  // Component 0 (index 0): Street Address - Replace with realistic street
  if (components.length > 0 && components[0] && components[0].trim() !== '') {
    result[0] = getRealisticStreet(components[0])
  } else {
    result[0] = ''
  }
  
  // Component 1 (index 1): Other Designation (e.g., apartment, suite) - REMOVE (may contain PHI)
  result[1] = ''
  
  // Component 2 (index 2): City - Replace with realistic city
  if (components.length > 2 && components[2] && components[2].trim() !== '') {
    result[2] = getRealisticCity(components[2])
  } else {
    result[2] = ''
  }
  
  // Component 3 (index 3): State - Replace with realistic state
  if (components.length > 3 && components[3] && components[3].trim() !== '') {
    // If it looks like a state code (2 letters), replace with realistic one
    if (/^[A-Z]{2}$/i.test(components[3].trim())) {
      result[3] = getRealisticState(components[3])
    } else {
      // If it's a full state name, map it to a realistic state code
      result[3] = getRealisticState(components[3])
    }
  } else {
    result[3] = ''
  }
  
  // Component 4 (index 4): ZIP - Replace with realistic ZIP (first 3 digits + 00)
  if (components.length > 4 && components[4] && components[4].trim() !== '') {
    result[4] = getRealisticZip(components[4])
  } else {
    result[4] = '00000'
  }
  
  // Component 5 (index 5): Country - KEEP (not identifying at country level)
  if (components.length > 5 && components[5] && components[5].trim() !== '') {
    result[5] = components[5]
  } else {
    result[5] = ''
  }
  
  // Component 6 (index 6): Address Type - REMOVE (may contain identifying info)
  result[6] = ''
  
  // Component 7 (index 7): Other Geographic Designation - REMOVE (geographic subdivision)
  result[7] = ''
  
  // Preserve any additional components as empty
  for (let i = 8; i < components.length; i++) {
    result[i] = ''
  }
  
  return result.join('^')
}

/**
 * Removes identifiers (MRN, SSN, account numbers, etc.)
 * Handles HL7 identifier format: ID^CheckDigit^CodeIdentifyingTheCheckDigit^AssigningAuthority^IdentifierTypeCode^AssigningFacility
 * @param {string} idStr - Identifier string (may be component-separated)
 * @param {string} type - Type of identifier (e.g., 'mrn', 'account', 'generic')
 * @returns {string} Realistic de-identified identifier preserving structure
 */
function deidentifyIdentifier(idStr, type = 'generic') {
  if (!idStr || idStr.trim() === '') return ''
  
  // If identifier contains component separator (^), extract first component for type detection
  let firstComponent = idStr
  let hasComponents = false
  let components = []
  
  if (idStr.includes('^')) {
    hasComponents = true
    components = idStr.split('^')
    firstComponent = components[0] || idStr
  }
  
  // Determine type from first component if not explicitly provided
  let detectedType = type
  if (type === 'generic') {
    const firstCompLower = firstComponent.toLowerCase()
    if (firstCompLower.includes('mrn') || firstCompLower.match(/^mrn/i)) {
      detectedType = 'mrn'
    } else if (firstCompLower.includes('account') || firstCompLower.includes('acct')) {
      detectedType = 'account'
    }
  }
  
  // Use the full original string as the key for mapping to ensure consistency
  // Generate base de-identified identifier using the full string as key
  const baseId = generateRealisticIdentifier(idStr, detectedType)
  
  // If identifier contains component separator (^), preserve structure
  if (hasComponents) {
    // Replace ID (first component) with de-identified value, keep other components
    const deidentified = [...components]
    if (deidentified[0] && deidentified[0].trim() !== '') {
      deidentified[0] = baseId
    }
    return deidentified.join('^')
  }
  
  return baseId
}

/**
 * Detects and removes Social Security Numbers
 * @param {string} ssnStr - String that may contain SSN
 * @param {boolean} forceDeidentify - If true, always de-identify even if pattern doesn't match
 * @returns {string} Realistic de-identified SSN
 */
function deidentifySSN(ssnStr, forceDeidentify = false) {
  if (!ssnStr || ssnStr.trim() === '') return ''
  
  // If forceDeidentify is true (called from known PHI field like PID-19), always de-identify
  if (forceDeidentify) {
    return generateRealisticSSN(ssnStr)
  }
  
  // SSN patterns: XXX-XX-XXXX, XXXXXXXXX, XXX XX XXXX
  const ssnPattern = /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/
  if (ssnPattern.test(ssnStr)) {
    return generateRealisticSSN(ssnStr)
  }
  
  // If it doesn't match pattern and not forced, return original
  return ssnStr
}

/**
 * Detects and removes URLs
 * @param {string} urlStr - String that may contain URL
 * @returns {string} Realistic de-identified URL
 */
function deidentifyURL(urlStr) {
  if (!urlStr || urlStr.trim() === '') return ''
  
  // URL patterns: http://, https://, www., ftp://
  const urlPattern = /(https?:\/\/|www\.|ftp:\/\/)[^\s]+/i
  if (urlPattern.test(urlStr)) {
    return generateRealisticURL(urlStr)
  }
  
  return urlStr
}

/**
 * Detects and removes IP addresses
 * @param {string} ipStr - String that may contain IP address
 * @returns {string} Realistic de-identified IP address
 */
function deidentifyIPAddress(ipStr) {
  if (!ipStr || ipStr.trim() === '') return ''
  
  // IPv4 pattern: XXX.XXX.XXX.XXX
  const ipv4Pattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/
  // IPv6 pattern (simplified)
  const ipv6Pattern = /\b([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/
  
  if (ipv4Pattern.test(ipStr) || ipv6Pattern.test(ipStr)) {
    return generateRealisticIP(ipStr)
  }
  
  return ipStr
}

/**
 * Detects and removes device identifiers and serial numbers
 * @param {string} deviceStr - String that may contain device identifier
 * @returns {string} Realistic de-identified device ID
 */
function deidentifyDeviceIdentifier(deviceStr) {
  if (!deviceStr || deviceStr.trim() === '') return ''
  
  // Device identifiers often contain alphanumeric patterns
  // This is a catch-all for device serial numbers, UDIs, etc.
  return generateRealisticDevice(deviceStr)
}

/**
 * Detects and removes vehicle identifiers
 * @param {string} vehicleStr - String that may contain vehicle identifier
 * @returns {string} Realistic de-identified vehicle ID
 */
function deidentifyVehicleIdentifier(vehicleStr) {
  if (!vehicleStr || vehicleStr.trim() === '') return ''
  
  // Vehicle identifiers (VINs, license plates, etc.)
  return generateRealisticVehicle(vehicleStr)
}

/**
 * Detects and removes biometric identifiers
 * @param {string} biometricStr - String that may contain biometric identifier
 * @returns {string} Realistic de-identified biometric ID
 */
function deidentifyBiometric(biometricStr) {
  if (!biometricStr || biometricStr.trim() === '') return ''
  
  // Biometric identifiers (fingerprints, voiceprints, retinal scans, etc.)
  return generateRealisticBiometric(biometricStr)
}

/**
 * De-identifies a single field value by detecting PHI patterns
 * Also handles organization/facility names that may be identifying
 * @param {string} value - Field value
 * @returns {string} De-identified value
 */
function deidentifyFieldByPattern(value) {
  if (!value || value.trim() === '') return ''
  
  let result = value
  
  // Check for URLs first (before other patterns)
  result = deidentifyURL(result)
  if (result !== value) return result
  
  // Check for IP addresses
  result = deidentifyIPAddress(result)
  if (result !== value) return result
  
  // Check for email addresses
  result = deidentifyEmail(result)
  if (result !== value) return result
  
  // Check for SSN
  result = deidentifySSN(result)
  if (result !== value) return result
  
  // Check for phone numbers
  result = deidentifyPhone(result)
  if (result !== value) return result
  
  // Check if it looks like an organization/facility name (contains common org words)
  // This is a heuristic - if it contains words like "hospital", "clinic", "medical", etc.
  const orgPattern = /\b(hospital|clinic|medical|center|facility|health|care|group|practice|system)\b/i
  if (orgPattern.test(result) && result.length > 5) {
    return generateRealisticOrganization(result)
  }
  
  return result
}

/**
 * De-identifies a single field value based on field type
 * @param {string} value - Field value
 * @param {string} fieldType - Type of field (e.g., 'name', 'date', 'phone')
 * @returns {string} De-identified value
 */
function deidentifyField(value, fieldType) {
  if (!value || value.trim() === '') return ''
  
  switch (fieldType) {
    case 'name':
      return deidentifyName(value)
    case 'date':
      return deidentifyDate(value)
    case 'phone':
    case 'fax':
      return deidentifyPhone(value)
    case 'email':
      return deidentifyEmail(value)
    case 'address':
      return deidentifyAddress(value)
    case 'identifier':
      return deidentifyIdentifier(value)
    case 'ssn':
      return deidentifySSN(value)
    case 'url':
      return deidentifyURL(value)
    case 'ip':
      return deidentifyIPAddress(value)
    case 'device':
      return deidentifyDeviceIdentifier(value)
    case 'vehicle':
      return deidentifyVehicleIdentifier(value)
    case 'biometric':
      return deidentifyBiometric(value)
    default:
      // Try pattern-based detection
      return deidentifyFieldByPattern(value)
  }
}

/**
 * De-identifies an HL7 segment based on segment type
 * @param {string} segment - HL7 segment string
 * @returns {string} De-identified segment
 */
function deidentifySegment(segment) {
  if (!segment || segment.trim() === '') return segment
  
  const fields = segment.split('|')
  const segmentType = fields[0]
  
  // MSH - Message Header Segment
  if (segmentType === 'MSH') {
    // De-identify sending/receiving facility and application in MSH
    const deidentifiedFields = [...fields]
    
    // MSH-2: Encoding Characters (keep - not PHI)
    
    // MSH-3: Sending Application (may be identifying)
    if (deidentifiedFields[2]) {
      deidentifiedFields[2] = generateRealisticApplication(deidentifiedFields[2])
    }
    
    // MSH-4: Sending Facility (may be identifying)
    if (deidentifiedFields[3]) {
      deidentifiedFields[3] = generateRealisticFacility(deidentifiedFields[3])
    }
    
    // MSH-5: Receiving Application (may be identifying)
    if (deidentifiedFields[4]) {
      deidentifiedFields[4] = generateRealisticApplication(deidentifiedFields[4])
    }
    
    // MSH-6: Receiving Facility (may be identifying)
    if (deidentifiedFields[5]) {
      deidentifiedFields[5] = generateRealisticFacility(deidentifiedFields[5])
    }
    
    // MSH-7: Date/Time of Message (keep only year)
    if (deidentifiedFields[6]) {
      deidentifiedFields[6] = deidentifyDate(deidentifiedFields[6])
    }
    
    // MSH-8: Security (can keep - not PHI)
    
    // MSH-9: Message Type (can keep - not PHI)
    
    // MSH-10: Message Control ID (may be identifying - de-identify)
    if (deidentifiedFields[9]) {
      counters.mrn++ // Reuse counter for message IDs
      const num = counters.mrn.toString().padStart(6, '0')
      deidentifiedFields[9] = `MSG${num}`
    }
    
    // MSH-11: Processing ID (can keep - not PHI)
    
    // MSH-12: Version ID (can keep - not PHI)
    
    // MSH-13: Sequence Number (can keep - not PHI)
    
    // MSH-14: Continuation Pointer (can keep - not PHI)
    
    // MSH-15: Accept Acknowledgment Type (can keep - not PHI)
    
    // MSH-16: Application Acknowledgment Type (can keep - not PHI)
    
    // MSH-17: Country Code (can keep - not PHI)
    
    // MSH-18: Character Set (can keep - not PHI)
    
    // MSH-19: Principal Language of Message (can keep - not PHI)
    
    // MSH-20: Alternate Character Set Handling Scheme (can keep - not PHI)
    
    // MSH-21: Message Profile Identifier (may be identifying)
    if (deidentifiedFields[20]) {
      deidentifiedFields[20] = deidentifyFieldByPattern(deidentifiedFields[20])
    }
    
    return deidentifiedFields.join('|')
  }
  
  // PID - Patient Identification Segment
  if (segmentType === 'PID') {
    const deidentifiedFields = [...fields]
    
    // PID-2: Patient ID (External ID) - de-identify
    if (deidentifiedFields[2]) {
      deidentifiedFields[2] = deidentifyIdentifier(deidentifiedFields[2])
    }
    
    // PID-3: Patient Identifier List (MRN, etc.) - handle repeating fields
    if (deidentifiedFields[3]) {
      const identifiers = deidentifiedFields[3].split('~')
      deidentifiedFields[3] = identifiers.map(id => deidentifyIdentifier(id, 'mrn')).join('~')
    }
    
    // PID-4: Alternate Patient ID - de-identify
    if (deidentifiedFields[4]) {
      const identifiers = deidentifiedFields[4].split('~')
      deidentifiedFields[4] = identifiers.map(id => deidentifyIdentifier(id)).join('~')
    }
    
    // PID-7: Date/Time of Birth (extract before name de-identification)
    if (deidentifiedFields[7]) {
      deidentifiedFields[7] = deidentifyDate(deidentifiedFields[7])
    }
    
    // PID-8: Administrative Sex - extract and store for gender-specific name de-identification
    let patientGender = null
    if (deidentifiedFields[8]) {
      // Extract gender code (M, F, O, U, etc.)
      const genderCode = deidentifiedFields[8].trim().toUpperCase()
      if (genderCode && (genderCode === 'M' || genderCode === 'F' || genderCode === 'O' || genderCode === 'U')) {
        patientGender = genderCode
        currentPatientGender = genderCode
      }
    }
    
    // PID-5: Patient Name - handle repeating fields (use gender for gender-specific names)
    if (deidentifiedFields[5]) {
      const names = deidentifiedFields[5].split('~')
      deidentifiedFields[5] = names.map(name => deidentifyName(name, 'patient', patientGender)).join('~')
    }
    
    // PID-6: Mother's Maiden Name (always use female names)
    if (deidentifiedFields[6]) {
      const names = deidentifiedFields[6].split('~')
      deidentifiedFields[6] = names.map(name => deidentifyName(name, 'patient', 'F')).join('~')
    }
    
    // PID-9: Patient Alias - handle repeating fields (use gender for gender-specific names)
    if (deidentifiedFields[9]) {
      const aliases = deidentifiedFields[9].split('~')
      deidentifiedFields[9] = aliases.map(alias => deidentifyName(alias, 'patient', patientGender)).join('~')
    }
    
    // PID-10: Race (can keep - not PHI)
    
    // PID-11: Patient Address - handle repeating fields
    if (deidentifiedFields[11]) {
      const addresses = deidentifiedFields[11].split('~')
      deidentifiedFields[11] = addresses.map(addr => deidentifyAddress(addr)).join('~')
    }
    
    // PID-12: County Code (geographic subdivision - remove)
    if (deidentifiedFields[12]) {
      deidentifiedFields[12] = ''
    }
    
    // PID-13: Phone Number - Home - handle repeating fields
    if (deidentifiedFields[13]) {
      const phones = deidentifiedFields[13].split('~')
      deidentifiedFields[13] = phones.map(phone => deidentifyPhone(phone, true)).join('~')
    }
    
    // PID-14: Phone Number - Business - handle repeating fields
    if (deidentifiedFields[14]) {
      const phones = deidentifiedFields[14].split('~')
      deidentifiedFields[14] = phones.map(phone => deidentifyPhone(phone, true)).join('~')
    }
    
    // PID-15: Primary Language (can keep - not PHI)
    
    // PID-16: Marital Status (can keep - not PHI)
    
    // PID-17: Religion (can keep - not PHI)
    
    // PID-18: Patient Account Number
    if (deidentifiedFields[18]) {
      deidentifiedFields[18] = deidentifyIdentifier(deidentifiedFields[18], 'account')
    }
    
    // PID-19: SSN - Patient Identifier
    if (deidentifiedFields[19]) {
      deidentifiedFields[19] = deidentifySSN(deidentifiedFields[19], true)
    }
    
    // PID-20: Driver's License Number
    if (deidentifiedFields[20]) {
      const licenses = deidentifiedFields[20].split('~')
      deidentifiedFields[20] = licenses.map(license => {
        // License format: Number^State^ExpirationDate
        if (license.includes('^')) {
          const parts = license.split('^')
          parts[0] = deidentifyIdentifier(parts[0]) // License number
          if (parts.length > 2) {
            parts[2] = deidentifyDate(parts[2]) // Expiration date
          }
          return parts.join('^')
        }
        return deidentifyIdentifier(license)
      }).join('~')
    }
    
    // PID-21: Mother's Identifier (de-identify)
    if (deidentifiedFields[21]) {
      const identifiers = deidentifiedFields[21].split('~')
      deidentifiedFields[21] = identifiers.map(id => deidentifyIdentifier(id)).join('~')
    }
    
    // PID-22: Ethnic Group (can keep - not PHI)
    
    // PID-23: Birth Place (geographic - remove or keep only state)
    if (deidentifiedFields[23]) {
      deidentifiedFields[23] = deidentifyAddress(deidentifiedFields[23])
    }
    
    // PID-24: Multiple Birth Indicator (can keep - not PHI)
    
    // PID-25: Birth Order (can keep - not PHI)
    
    // PID-26: Citizenship (can keep - not PHI)
    
    // PID-27: Veterans Military Status (can keep - not PHI)
    
    // PID-28: Nationality (can keep - not PHI)
    
    // PID-29: Patient Death Date and Time
    if (deidentifiedFields[29]) {
      deidentifiedFields[29] = deidentifyDate(deidentifiedFields[29])
    }
    
    // PID-30: Patient Death Indicator (can keep - not PHI)
    
    return deidentifiedFields.join('|')
  }
  
  // PV1 - Patient Visit Segment
  if (segmentType === 'PV1') {
    const deidentifiedFields = [...fields]
    
    // PV1-7: Attending Doctor (may contain name)
    if (deidentifiedFields[7]) {
      const doctors = deidentifiedFields[7].split('~')
      deidentifiedFields[7] = doctors.map(doc => {
        // Doctor format: ID^FamilyName^GivenName^MiddleName^Suffix^Prefix^Degree
        if (doc.includes('^')) {
          const parts = doc.split('^')
          parts[0] = deidentifyIdentifier(parts[0]) // ID
          if (parts.length > 1) parts[1] = deidentifyName(parts[1], 'doctor') // Family name
          if (parts.length > 2) parts[2] = deidentifyName(parts[2], 'doctor') // Given name
          if (parts.length > 3) parts[3] = deidentifyName(parts[3], 'doctor') // Middle name
          return parts.join('^')
        }
        return deidentifyName(doc, 'doctor')
      }).join('~')
    }
    
    // PV1-8: Referring Doctor (may contain name)
    if (deidentifiedFields[8]) {
      const doctors = deidentifiedFields[8].split('~')
      deidentifiedFields[8] = doctors.map(doc => {
        if (doc.includes('^')) {
          const parts = doc.split('^')
          parts[0] = deidentifyIdentifier(parts[0])
          if (parts.length > 1) parts[1] = deidentifyName(parts[1])
          if (parts.length > 2) parts[2] = deidentifyName(parts[2])
          if (parts.length > 3) parts[3] = deidentifyName(parts[3])
          return parts.join('^')
        }
        return deidentifyName(doc)
      }).join('~')
    }
    
    // PV1-9: Consulting Doctor (may contain name)
    if (deidentifiedFields[9]) {
      const doctors = deidentifiedFields[9].split('~')
      deidentifiedFields[9] = doctors.map(doc => {
        if (doc.includes('^')) {
          const parts = doc.split('^')
          parts[0] = deidentifyIdentifier(parts[0])
          if (parts.length > 1) parts[1] = deidentifyName(parts[1])
          if (parts.length > 2) parts[2] = deidentifyName(parts[2])
          if (parts.length > 3) parts[3] = deidentifyName(parts[3])
          return parts.join('^')
        }
        return deidentifyName(doc)
      }).join('~')
    }
    
    // PV1-17: Admitting Doctor (may contain name)
    if (deidentifiedFields[17]) {
      const doctors = deidentifiedFields[17].split('~')
      deidentifiedFields[17] = doctors.map(doc => {
        if (doc.includes('^')) {
          const parts = doc.split('^')
          parts[0] = deidentifyIdentifier(parts[0])
          if (parts.length > 1) parts[1] = deidentifyName(parts[1])
          if (parts.length > 2) parts[2] = deidentifyName(parts[2])
          if (parts.length > 3) parts[3] = deidentifyName(parts[3])
          return parts.join('^')
        }
        return deidentifyName(doc)
      }).join('~')
    }
    
    // PV1-19: Visit Number (account number)
    if (deidentifiedFields[19]) {
      deidentifiedFields[19] = deidentifyIdentifier(deidentifiedFields[19])
    }
    
    // PV1-44: Admit Date/Time
    if (deidentifiedFields[44]) {
      deidentifiedFields[44] = deidentifyDate(deidentifiedFields[44])
    }
    
    // PV1-45: Discharge Date/Time
    if (deidentifiedFields[45]) {
      deidentifiedFields[45] = deidentifyDate(deidentifiedFields[45])
    }
    
    // PV1-52: Visit Description (may contain PHI)
    if (deidentifiedFields[52]) {
      deidentifiedFields[52] = deidentifyFieldByPattern(deidentifiedFields[52])
    }
    
    return deidentifiedFields.join('|')
  }
  
  // NK1 - Next of Kin Segment
  if (segmentType === 'NK1') {
    const deidentifiedFields = [...fields]
    
    // NK1-15: Administrative Sex - extract for gender-specific name de-identification
    let nk1Gender = null
    if (deidentifiedFields[15]) {
      const genderCode = deidentifiedFields[15].trim().toUpperCase()
      if (genderCode && (genderCode === 'M' || genderCode === 'F' || genderCode === 'O' || genderCode === 'U')) {
        nk1Gender = genderCode
      }
    }
    
    // NK1-2: Name - handle repeating fields (use gender for gender-specific names)
    if (deidentifiedFields[2]) {
      const names = deidentifiedFields[2].split('~')
      deidentifiedFields[2] = names.map(name => deidentifyName(name, 'nextofkin', nk1Gender)).join('~')
    }
    
    // NK1-3: Relationship (can keep - not PHI)
    
    // NK1-4: Address - handle repeating fields
    if (deidentifiedFields[4]) {
      const addresses = deidentifiedFields[4].split('~')
      deidentifiedFields[4] = addresses.map(addr => deidentifyAddress(addr)).join('~')
    }
    
    // NK1-5: Phone Number - handle repeating fields
    if (deidentifiedFields[5]) {
      const phones = deidentifiedFields[5].split('~')
      deidentifiedFields[5] = phones.map(phone => deidentifyPhone(phone, true)).join('~')
    }
    
    // NK1-6: Business Phone Number - handle repeating fields
    if (deidentifiedFields[6]) {
      const phones = deidentifiedFields[6].split('~')
      deidentifiedFields[6] = phones.map(phone => deidentifyPhone(phone, true)).join('~')
    }
    
    // NK1-7: Contact Role (can keep - not PHI)
    
    // NK1-8: Start Date
    if (deidentifiedFields[8]) {
      deidentifiedFields[8] = deidentifyDate(deidentifiedFields[8])
    }
    
    // NK1-9: End Date
    if (deidentifiedFields[9]) {
      deidentifiedFields[9] = deidentifyDate(deidentifiedFields[9])
    }
    
    // NK1-10: Next of Kin Job Title (may contain identifying info)
    if (deidentifiedFields[10]) {
      deidentifiedFields[10] = deidentifyFieldByPattern(deidentifiedFields[10])
    }
    
    // NK1-11: Next of Kin Job Code/Class (can keep - not PHI)
    
    // NK1-12: Next of Kin Employee Number
    if (deidentifiedFields[12]) {
      deidentifiedFields[12] = deidentifyIdentifier(deidentifiedFields[12])
    }
    
    // NK1-13: Organization Name (may be identifying)
    if (deidentifiedFields[13]) {
      deidentifiedFields[13] = deidentifyFieldByPattern(deidentifiedFields[13])
    }
    
    // NK1-14: Marital Status (can keep - not PHI)
    
    // NK1-15: Administrative Sex (can keep - not PHI, but extracted above for name de-identification)
    
    // NK1-16: Date/Time of Birth
    if (deidentifiedFields[16]) {
      deidentifiedFields[16] = deidentifyDate(deidentifiedFields[16])
    }
    
    // NK1-17: Living Dependency (can keep - not PHI)
    
    // NK1-18: Ambulatory Status (can keep - not PHI)
    
    // NK1-19: Citizenship (can keep - not PHI)
    
    // NK1-20: Primary Language (can keep - not PHI)
    
    // NK1-21: Living Arrangement (can keep - not PHI)
    
    // NK1-22: Publicity Code (can keep - not PHI)
    
    // NK1-23: Protection Indicator (can keep - not PHI)
    
    // NK1-24: Student Indicator (can keep - not PHI)
    
    // NK1-25: Religion (can keep - not PHI)
    
    // NK1-26: Mother's Maiden Name (always use female names)
    if (deidentifiedFields[26]) {
      const names = deidentifiedFields[26].split('~')
      deidentifiedFields[26] = names.map(name => deidentifyName(name, 'nextofkin', 'F')).join('~')
    }
    
    // NK1-27: Nationality (can keep - not PHI)
    
    // NK1-28: Ethnic Group (can keep - not PHI)
    
    // NK1-29: Contact Reason (can keep - not PHI)
    
    // NK1-30: Contact Person's Name
    if (deidentifiedFields[30]) {
      const names = deidentifiedFields[30].split('~')
      deidentifiedFields[30] = names.map(name => deidentifyName(name, 'contact')).join('~')
    }
    
    // NK1-31: Contact Person's Telephone Number
    if (deidentifiedFields[31]) {
      const phones = deidentifiedFields[31].split('~')
      deidentifiedFields[31] = phones.map(phone => deidentifyPhone(phone, true)).join('~')
    }
    
    // NK1-32: Contact Person's Address
    if (deidentifiedFields[32]) {
      const addresses = deidentifiedFields[32].split('~')
      deidentifiedFields[32] = addresses.map(addr => deidentifyAddress(addr)).join('~')
    }
    
    // NK1-33: Next of Kin/Associated Party's Identifiers
    if (deidentifiedFields[33]) {
      const identifiers = deidentifiedFields[33].split('~')
      deidentifiedFields[33] = identifiers.map(id => deidentifyIdentifier(id)).join('~')
    }
    
    // NK1-34: Job Status (can keep - not PHI)
    
    // NK1-35: Race (can keep - not PHI)
    
    // NK1-36: Handicap (can keep - not PHI)
    
    // NK1-37: Contact Person Social Security Number
    if (deidentifiedFields[37]) {
      deidentifiedFields[37] = deidentifySSN(deidentifiedFields[37], true)
    }
    
    return deidentifiedFields.join('|')
  }
  
  // IN1 - Insurance Segment
  if (segmentType === 'IN1') {
    const deidentifiedFields = [...fields]
    
    // IN1-43: Insured's Sex - extract for gender-specific name de-identification
    let insuredGender = null
    if (deidentifiedFields[43]) {
      const genderCode = deidentifiedFields[43].trim().toUpperCase()
      if (genderCode && (genderCode === 'M' || genderCode === 'F' || genderCode === 'O' || genderCode === 'U')) {
        insuredGender = genderCode
      }
    }
    
    // IN1-2: Insurance Plan ID (can keep - not PHI)
    
    // IN1-3: Insurance Company ID
    if (deidentifiedFields[3]) {
      const identifiers = deidentifiedFields[3].split('~')
      deidentifiedFields[3] = identifiers.map(id => deidentifyIdentifier(id)).join('~')
    }
    
    // IN1-4: Insurance Company Name (may be identifying)
    if (deidentifiedFields[4]) {
      deidentifiedFields[4] = deidentifyFieldByPattern(deidentifiedFields[4])
    }
    
    // IN1-5: Insurance Company Address
    if (deidentifiedFields[5]) {
      const addresses = deidentifiedFields[5].split('~')
      deidentifiedFields[5] = addresses.map(addr => deidentifyAddress(addr)).join('~')
    }
    
    // IN1-6: Insurance Co Contact Person
    if (deidentifiedFields[6]) {
      const names = deidentifiedFields[6].split('~')
      deidentifiedFields[6] = names.map(name => deidentifyName(name, 'contact')).join('~')
    }
    
    // IN1-7: Insurance Co Phone Number
    if (deidentifiedFields[7]) {
      const phones = deidentifiedFields[7].split('~')
      deidentifiedFields[7] = phones.map(phone => deidentifyPhone(phone, true)).join('~')
    }
    
    // IN1-8: Group Number
    if (deidentifiedFields[8]) {
      deidentifiedFields[8] = deidentifyIdentifier(deidentifiedFields[8])
    }
    
    // IN1-9: Group Name (may be identifying)
    if (deidentifiedFields[9]) {
      deidentifiedFields[9] = deidentifyFieldByPattern(deidentifiedFields[9])
    }
    
    // IN1-10: Insured's Group Emp ID
    if (deidentifiedFields[10]) {
      deidentifiedFields[10] = deidentifyIdentifier(deidentifiedFields[10])
    }
    
    // IN1-11: Insured's Group Emp Name (may be identifying)
    if (deidentifiedFields[11]) {
      deidentifiedFields[11] = deidentifyFieldByPattern(deidentifiedFields[11])
    }
    
    // IN1-12: Plan Effective Date
    if (deidentifiedFields[12]) {
      deidentifiedFields[12] = deidentifyDate(deidentifiedFields[12])
    }
    
    // IN1-13: Plan Expiration Date
    if (deidentifiedFields[13]) {
      deidentifiedFields[13] = deidentifyDate(deidentifiedFields[13])
    }
    
    // IN1-14: Authorization Information
    if (deidentifiedFields[14]) {
      deidentifiedFields[14] = deidentifyFieldByPattern(deidentifiedFields[14])
    }
    
    // IN1-15: Plan Type (can keep - not PHI)
    
    // IN1-16: Name of Insured (use gender for gender-specific names)
    if (deidentifiedFields[16]) {
      const names = deidentifiedFields[16].split('~')
      deidentifiedFields[16] = names.map(name => deidentifyName(name, 'patient', insuredGender)).join('~')
    }
    
    // IN1-17: Insured's Relationship to Patient (can keep - not PHI)
    
    // IN1-18: Insured's Date of Birth
    if (deidentifiedFields[18]) {
      deidentifiedFields[18] = deidentifyDate(deidentifiedFields[18])
    }
    
    // IN1-19: Insured's Address
    if (deidentifiedFields[19]) {
      const addresses = deidentifiedFields[19].split('~')
      deidentifiedFields[19] = addresses.map(addr => deidentifyAddress(addr)).join('~')
    }
    
    // IN1-20: Assignment of Benefits (can keep - not PHI)
    
    // IN1-21: Coordination of Benefits (can keep - not PHI)
    
    // IN1-22: Coord of Ben. Priority (can keep - not PHI)
    
    // IN1-23: Notice of Admission Flag (can keep - not PHI)
    
    // IN1-24: Notice of Admission Date
    if (deidentifiedFields[24]) {
      deidentifiedFields[24] = deidentifyDate(deidentifiedFields[24])
    }
    
    // IN1-25: Report of Eligibility Flag (can keep - not PHI)
    
    // IN1-26: Report of Eligibility Date
    if (deidentifiedFields[26]) {
      deidentifiedFields[26] = deidentifyDate(deidentifiedFields[26])
    }
    
    // IN1-27: Release Information Code (can keep - not PHI)
    
    // IN1-28: Pre-Admit Cert (PAC) (can keep - not PHI)
    
    // IN1-29: Verification Date/Time
    if (deidentifiedFields[29]) {
      deidentifiedFields[29] = deidentifyDate(deidentifiedFields[29])
    }
    
    // IN1-30: Verification By (may contain name)
    if (deidentifiedFields[30]) {
      deidentifiedFields[30] = deidentifyName(deidentifiedFields[30], 'contact')
    }
    
    // IN1-31: Type of Agreement Code (can keep - not PHI)
    
    // IN1-32: Billing Status (can keep - not PHI)
    
    // IN1-33: Lifetime Reserve Days (can keep - not PHI)
    
    // IN1-34: Delay Before L.R. Day (can keep - not PHI)
    
    // IN1-35: Company Plan Code (can keep - not PHI)
    
    // IN1-36: Policy Number
    if (deidentifiedFields[36]) {
      deidentifiedFields[36] = deidentifyIdentifier(deidentifiedFields[36])
    }
    
    // IN1-37: Policy Deductible (can keep - not PHI)
    
    // IN1-38: Policy Limit - Amount (can keep - not PHI)
    
    // IN1-39: Policy Limit - Days (can keep - not PHI)
    
    // IN1-40: Room Rate - Semi-Private (can keep - not PHI)
    
    // IN1-41: Room Rate - Private (can keep - not PHI)
    
    // IN1-42: Insured's Employment Status (can keep - not PHI)
    
    // IN1-43: Insured's Sex (can keep - not PHI, but extracted above for name de-identification)
    
    // IN1-44: Insured's Employer Address
    if (deidentifiedFields[44]) {
      const addresses = deidentifiedFields[44].split('~')
      deidentifiedFields[44] = addresses.map(addr => deidentifyAddress(addr)).join('~')
    }
    
    // IN1-45: Verification Status (can keep - not PHI)
    
    // IN1-46: Prior Insurance Plan ID (can keep - not PHI)
    
    // IN1-47: Coverage Type (can keep - not PHI)
    
    // IN1-48: Handicap (can keep - not PHI)
    
    // IN1-49: Insured's ID Number
    if (deidentifiedFields[49]) {
      deidentifiedFields[49] = deidentifyIdentifier(deidentifiedFields[49])
    }
    
    // IN1-50: Signature Code (can keep - not PHI)
    
    // IN1-51: Signature Code Date
    if (deidentifiedFields[51]) {
      deidentifiedFields[51] = deidentifyDate(deidentifiedFields[51])
    }
    
    // IN1-52: Insured's Birth Place (geographic - remove or keep only state)
    if (deidentifiedFields[52]) {
      deidentifiedFields[52] = deidentifyAddress(deidentifiedFields[52])
    }
    
    // IN1-53: VIP Indicator (can keep - not PHI)
    
    return deidentifiedFields.join('|')
  }
  
  // IN2 - Insurance Additional Information Segment
  if (segmentType === 'IN2') {
    const deidentifiedFields = [...fields]
    
    // IN2-1: Insured's Employee ID
    if (deidentifiedFields[1]) {
      deidentifiedFields[1] = deidentifyIdentifier(deidentifiedFields[1])
    }
    
    // IN2-2: Insured's Social Security Number
    if (deidentifiedFields[2]) {
      deidentifiedFields[2] = deidentifySSN(deidentifiedFields[2], true)
    }
    
    // IN2-3: Insured's Employer Name (may be identifying)
    if (deidentifiedFields[3]) {
      deidentifiedFields[3] = deidentifyFieldByPattern(deidentifiedFields[3])
    }
    
    // IN2-4: Employer Information Data (may contain PHI)
    if (deidentifiedFields[4]) {
      deidentifiedFields[4] = deidentifyFieldByPattern(deidentifiedFields[4])
    }
    
    // IN2-5: Mail Claim Party (can keep - not PHI)
    
    // IN2-6: Medicare Health Ins Card Number
    if (deidentifiedFields[6]) {
      deidentifiedFields[6] = deidentifyIdentifier(deidentifiedFields[6])
    }
    
    // IN2-7: Medicaid Case Name
    if (deidentifiedFields[7]) {
      const names = deidentifiedFields[7].split('~')
      deidentifiedFields[7] = names.map(name => deidentifyName(name, 'patient')).join('~')
    }
    
    // IN2-8: Medicaid Case Number
    if (deidentifiedFields[8]) {
      deidentifiedFields[8] = deidentifyIdentifier(deidentifiedFields[8])
    }
    
    // IN2-9: Military Sponsor Name
    if (deidentifiedFields[9]) {
      const names = deidentifiedFields[9].split('~')
      deidentifiedFields[9] = names.map(name => deidentifyName(name, 'contact')).join('~')
    }
    
    // IN2-10: Military ID Number
    if (deidentifiedFields[10]) {
      deidentifiedFields[10] = deidentifyIdentifier(deidentifiedFields[10])
    }
    
    // IN2-11: Dependent Of Military Recipient (can keep - not PHI)
    
    // IN2-12: Military Organization (may be identifying)
    if (deidentifiedFields[12]) {
      deidentifiedFields[12] = deidentifyFieldByPattern(deidentifiedFields[12])
    }
    
    // IN2-13: Military Station (geographic - remove or keep only state)
    if (deidentifiedFields[13]) {
      deidentifiedFields[13] = deidentifyAddress(deidentifiedFields[13])
    }
    
    // IN2-14: Military Service (can keep - not PHI)
    
    // IN2-15: Military Rank/Grade (can keep - not PHI)
    
    // IN2-16: Military Status (can keep - not PHI)
    
    // IN2-17: Military Retire Date
    if (deidentifiedFields[17]) {
      deidentifiedFields[17] = deidentifyDate(deidentifiedFields[17])
    }
    
    // IN2-18: Military Non-Avail Cert On File (can keep - not PHI)
    
    // IN2-19: Baby Coverage (can keep - not PHI)
    
    // IN2-20: Combine Baby Bill (can keep - not PHI)
    
    // IN2-21: Blood Deductible (can keep - not PHI)
    
    // IN2-22: Special Coverage Approval Name
    if (deidentifiedFields[22]) {
      const names = deidentifiedFields[22].split('~')
      deidentifiedFields[22] = names.map(name => deidentifyName(name, 'contact')).join('~')
    }
    
    // IN2-23: Special Coverage Approval Title (may be identifying)
    if (deidentifiedFields[23]) {
      deidentifiedFields[23] = deidentifyFieldByPattern(deidentifiedFields[23])
    }
    
    // IN2-24: Non-Covered Insurance Code (can keep - not PHI)
    
    // IN2-25: Payor ID
    if (deidentifiedFields[25]) {
      const identifiers = deidentifiedFields[25].split('~')
      deidentifiedFields[25] = identifiers.map(id => deidentifyIdentifier(id)).join('~')
    }
    
    // IN2-26: Payor Subscriber ID
    if (deidentifiedFields[26]) {
      deidentifiedFields[26] = deidentifyIdentifier(deidentifiedFields[26])
    }
    
    // IN2-27: Eligibility Source (can keep - not PHI)
    
    // IN2-28: Room Coverage Type/Amount (can keep - not PHI)
    
    // IN2-29: Policy Type/Amount (can keep - not PHI)
    
    // IN2-30: Daily Deductible (can keep - not PHI)
    
    // IN2-31: Living Dependency (can keep - not PHI)
    
    // IN2-32: Ambulatory Status (can keep - not PHI)
    
    // IN2-33: Citizenship (can keep - not PHI)
    
    // IN2-34: Primary Language (can keep - not PHI)
    
    // IN2-35: Living Arrangement (can keep - not PHI)
    
    // IN2-36: Publicity Code (can keep - not PHI)
    
    // IN2-37: Protection Indicator (can keep - not PHI)
    
    // IN2-38: Student Indicator (can keep - not PHI)
    
    // IN2-39: Religion (can keep - not PHI)
    
    // IN2-40: Mother's Maiden Name (always use female names)
    if (deidentifiedFields[40]) {
      const names = deidentifiedFields[40].split('~')
      deidentifiedFields[40] = names.map(name => deidentifyName(name, 'patient', 'F')).join('~')
    }
    
    // IN2-41: Administrative Sex (can keep - not PHI)
    
    // IN2-42: Insured's Employment Start Date
    if (deidentifiedFields[42]) {
      deidentifiedFields[42] = deidentifyDate(deidentifiedFields[42])
    }
    
    // IN2-43: Insured's Employment Stop Date
    if (deidentifiedFields[43]) {
      deidentifiedFields[43] = deidentifyDate(deidentifiedFields[43])
    }
    
    // IN2-44: Insured's Contact Person Name
    if (deidentifiedFields[44]) {
      const names = deidentifiedFields[44].split('~')
      deidentifiedFields[44] = names.map(name => deidentifyName(name, 'contact')).join('~')
    }
    
    // IN2-45: Insured's Contact Person Phone Number
    if (deidentifiedFields[45]) {
      const phones = deidentifiedFields[45].split('~')
      deidentifiedFields[45] = phones.map(phone => deidentifyPhone(phone, true)).join('~')
    }
    
    // IN2-46: Insured's Contact Person Reason (can keep - not PHI)
    
    // IN2-47: Relationship to the Patient Start Date
    if (deidentifiedFields[47]) {
      deidentifiedFields[47] = deidentifyDate(deidentifiedFields[47])
    }
    
    // IN2-48: Relationship to the Patient Stop Date
    if (deidentifiedFields[48]) {
      deidentifiedFields[48] = deidentifyDate(deidentifiedFields[48])
    }
    
    // IN2-49: Insurance Co Contact Reason (can keep - not PHI)
    
    // IN2-50: Insurance Co Contact Phone Number
    if (deidentifiedFields[50]) {
      const phones = deidentifiedFields[50].split('~')
      deidentifiedFields[50] = phones.map(phone => deidentifyPhone(phone, true)).join('~')
    }
    
    // IN2-51: Policy Scope (can keep - not PHI)
    
    // IN2-52: Policy Source (can keep - not PHI)
    
    // IN2-53: Patient Member Number
    if (deidentifiedFields[53]) {
      deidentifiedFields[53] = deidentifyIdentifier(deidentifiedFields[53])
    }
    
    // IN2-54: Guarantor's Relationship to Insured (can keep - not PHI)
    
    // IN2-55: Insured's Phone Number - Home
    if (deidentifiedFields[55]) {
      const phones = deidentifiedFields[55].split('~')
      deidentifiedFields[55] = phones.map(phone => deidentifyPhone(phone, true)).join('~')
    }
    
    // IN2-56: Insured's Employer Phone Number
    if (deidentifiedFields[56]) {
      const phones = deidentifiedFields[56].split('~')
      deidentifiedFields[56] = phones.map(phone => deidentifyPhone(phone, true)).join('~')
    }
    
    // IN2-57: Military Handicapped Program (can keep - not PHI)
    
    // IN2-58: Suspend Flag (can keep - not PHI)
    
    // IN2-59: Copay Limit Flag (can keep - not PHI)
    
    // IN2-60: Stoploss Limit Flag (can keep - not PHI)
    
    // IN2-61: Insured Organization Name (may be identifying)
    if (deidentifiedFields[61]) {
      deidentifiedFields[61] = deidentifyFieldByPattern(deidentifiedFields[61])
    }
    
    // IN2-62: Insured Organization Type (can keep - not PHI)
    
    // IN2-63: Employer Contact Person Name
    if (deidentifiedFields[63]) {
      const names = deidentifiedFields[63].split('~')
      deidentifiedFields[63] = names.map(name => deidentifyName(name, 'contact')).join('~')
    }
    
    // IN2-64: Employer Contact Person Phone Number
    if (deidentifiedFields[64]) {
      const phones = deidentifiedFields[64].split('~')
      deidentifiedFields[64] = phones.map(phone => deidentifyPhone(phone, true)).join('~')
    }
    
    // IN2-65: Insured's Employer Address
    if (deidentifiedFields[65]) {
      const addresses = deidentifiedFields[65].split('~')
      deidentifiedFields[65] = addresses.map(addr => deidentifyAddress(addr)).join('~')
    }
    
    // IN2-66: Insured's Employer Organization Name (may be identifying)
    if (deidentifiedFields[66]) {
      deidentifiedFields[66] = deidentifyFieldByPattern(deidentifiedFields[66])
    }
    
    return deidentifiedFields.join('|')
  }
  
  // OBR - Observation Request Segment
  if (segmentType === 'OBR') {
    const deidentifiedFields = [...fields]
    
    // OBR-7: Observation Date/Time
    if (deidentifiedFields[7]) {
      deidentifiedFields[7] = deidentifyDate(deidentifiedFields[7])
    }
    
    // OBR-8: Observation End Date/Time
    if (deidentifiedFields[8]) {
      deidentifiedFields[8] = deidentifyDate(deidentifiedFields[8])
    }
    
    // OBR-10: Collector ID (may contain name)
    if (deidentifiedFields[10]) {
      const collectors = deidentifiedFields[10].split('~')
      deidentifiedFields[10] = collectors.map(collector => {
        if (collector.includes('^')) {
          const parts = collector.split('^')
          parts[0] = deidentifyIdentifier(parts[0])
          if (parts.length > 1) parts[1] = deidentifyName(parts[1])
          if (parts.length > 2) parts[2] = deidentifyName(parts[2])
          return parts.join('^')
        }
        return deidentifyIdentifier(collector)
      }).join('~')
    }
    
    // OBR-11: Specimen Action Code (can keep - not PHI)
    
    // OBR-12: Danger Code (can keep - not PHI)
    
    // OBR-13: Relevant Clinical Information (may contain PHI)
    if (deidentifiedFields[13]) {
      deidentifiedFields[13] = deidentifyFieldByPattern(deidentifiedFields[13])
    }
    
    // OBR-14: Specimen Received Date/Time
    if (deidentifiedFields[14]) {
      deidentifiedFields[14] = deidentifyDate(deidentifiedFields[14])
    }
    
    // OBR-15: Specimen Source (can keep - not PHI)
    
    // OBR-16: Ordering Provider (may contain name)
    if (deidentifiedFields[16]) {
      const providers = deidentifiedFields[16].split('~')
      deidentifiedFields[16] = providers.map(provider => {
        if (provider.includes('^')) {
          const parts = provider.split('^')
          parts[0] = deidentifyIdentifier(parts[0])
          if (parts.length > 1) parts[1] = deidentifyName(parts[1])
          if (parts.length > 2) parts[2] = deidentifyName(parts[2])
          return parts.join('^')
        }
        return deidentifyName(provider, 'provider')
      }).join('~')
    }
    
    // OBR-17: Order Callback Phone Number
    if (deidentifiedFields[17]) {
      const phones = deidentifiedFields[17].split('~')
      deidentifiedFields[17] = phones.map(phone => deidentifyPhone(phone, true)).join('~')
    }
    
    // OBR-18: Placer Field 1 (may contain PHI)
    if (deidentifiedFields[18]) {
      deidentifiedFields[18] = deidentifyFieldByPattern(deidentifiedFields[18])
    }
    
    // OBR-19: Placer Field 2 (may contain PHI)
    if (deidentifiedFields[19]) {
      deidentifiedFields[19] = deidentifyFieldByPattern(deidentifiedFields[19])
    }
    
    // OBR-20: Filler Field 1 (may contain PHI)
    if (deidentifiedFields[20]) {
      deidentifiedFields[20] = deidentifyFieldByPattern(deidentifiedFields[20])
    }
    
    // OBR-21: Filler Field 2 (may contain PHI)
    if (deidentifiedFields[21]) {
      deidentifiedFields[21] = deidentifyFieldByPattern(deidentifiedFields[21])
    }
    
    // OBR-22: Results Rpt/Status Chng - Date/Time
    if (deidentifiedFields[22]) {
      deidentifiedFields[22] = deidentifyDate(deidentifiedFields[22])
    }
    
    // OBR-23: Charge to Practice (can keep - not PHI)
    
    // OBR-24: Diagnostic Serv Sect ID (can keep - not PHI)
    
    // OBR-25: Result Status (can keep - not PHI)
    
    // OBR-26: Parent Result (can keep - not PHI)
    
    // OBR-27: Quantity/Timing (may contain dates)
    if (deidentifiedFields[27]) {
      // Check for date patterns in timing
      deidentifiedFields[27] = deidentifyFieldByPattern(deidentifiedFields[27])
    }
    
    // OBR-28: Result Copies To (may contain names)
    if (deidentifiedFields[28]) {
      const recipients = deidentifiedFields[28].split('~')
      deidentifiedFields[28] = recipients.map(recipient => {
        if (recipient.includes('^')) {
          const parts = recipient.split('^')
          if (parts.length > 1) parts[1] = deidentifyName(parts[1])
          if (parts.length > 2) parts[2] = deidentifyName(parts[2])
          return parts.join('^')
        }
        return deidentifyName(recipient, 'contact')
      }).join('~')
    }
    
    // OBR-29: Parent (can keep - not PHI)
    
    // OBR-30: Transportation Mode (can keep - not PHI)
    
    // OBR-31: Reason for Study (may contain PHI)
    if (deidentifiedFields[31]) {
      deidentifiedFields[31] = deidentifyFieldByPattern(deidentifiedFields[31])
    }
    
    // OBR-32: Principal Result Interpreter (may contain name)
    if (deidentifiedFields[32]) {
      const interpreters = deidentifiedFields[32].split('~')
      deidentifiedFields[32] = interpreters.map(interpreter => {
        if (interpreter.includes('^')) {
          const parts = interpreter.split('^')
          parts[0] = deidentifyIdentifier(parts[0])
          if (parts.length > 1) parts[1] = deidentifyName(parts[1])
          if (parts.length > 2) parts[2] = deidentifyName(parts[2])
          return parts.join('^')
        }
        return deidentifyName(interpreter, 'provider')
      }).join('~')
    }
    
    // OBR-33: Assistant Result Interpreter (may contain name)
    if (deidentifiedFields[33]) {
      const interpreters = deidentifiedFields[33].split('~')
      deidentifiedFields[33] = interpreters.map(interpreter => {
        if (interpreter.includes('^')) {
          const parts = interpreter.split('^')
          parts[0] = deidentifyIdentifier(parts[0])
          if (parts.length > 1) parts[1] = deidentifyName(parts[1])
          if (parts.length > 2) parts[2] = deidentifyName(parts[2])
          return parts.join('^')
        }
        return deidentifyName(interpreter, 'provider')
      }).join('~')
    }
    
    // OBR-34: Technician (may contain name)
    if (deidentifiedFields[34]) {
      const technicians = deidentifiedFields[34].split('~')
      deidentifiedFields[34] = technicians.map(technician => {
        if (technician.includes('^')) {
          const parts = technician.split('^')
          parts[0] = deidentifyIdentifier(parts[0])
          if (parts.length > 1) parts[1] = deidentifyName(parts[1])
          if (parts.length > 2) parts[2] = deidentifyName(parts[2])
          return parts.join('^')
        }
        return deidentifyName(technician, 'provider')
      }).join('~')
    }
    
    // OBR-35: Transcriptionist (may contain name)
    if (deidentifiedFields[35]) {
      const transcriptionists = deidentifiedFields[35].split('~')
      deidentifiedFields[35] = transcriptionists.map(transcriptionist => {
        if (transcriptionist.includes('^')) {
          const parts = transcriptionist.split('^')
          parts[0] = deidentifyIdentifier(parts[0])
          if (parts.length > 1) parts[1] = deidentifyName(parts[1])
          if (parts.length > 2) parts[2] = deidentifyName(parts[2])
          return parts.join('^')
        }
        return deidentifyName(transcriptionist, 'provider')
      }).join('~')
    }
    
    // OBR-36: Scheduled Date/Time
    if (deidentifiedFields[36]) {
      deidentifiedFields[36] = deidentifyDate(deidentifiedFields[36])
    }
    
    // OBR-37: Number of Sample Containers (can keep - not PHI)
    
    // OBR-38: Transport Logistics of Collected Sample (can keep - not PHI)
    
    // OBR-39: Collector's Comment (may contain PHI)
    if (deidentifiedFields[39]) {
      deidentifiedFields[39] = deidentifyFieldByPattern(deidentifiedFields[39])
    }
    
    // OBR-40: Transport Arrangement Responsibility (can keep - not PHI)
    
    // OBR-41: Transport Arranged (can keep - not PHI)
    
    // OBR-42: Escort Required (can keep - not PHI)
    
    // OBR-43: Planned Patient Transport Comment (may contain PHI)
    if (deidentifiedFields[43]) {
      deidentifiedFields[43] = deidentifyFieldByPattern(deidentifiedFields[43])
    }
    
    // OBR-44: Procedure Code (can keep - not PHI)
    
    // OBR-45: Procedure Code Modifier (can keep - not PHI)
    
    // OBR-46: Placer Supplemental Service Information (may contain PHI)
    if (deidentifiedFields[46]) {
      deidentifiedFields[46] = deidentifyFieldByPattern(deidentifiedFields[46])
    }
    
    // OBR-47: Filler Supplemental Service Information (may contain PHI)
    if (deidentifiedFields[47]) {
      deidentifiedFields[47] = deidentifyFieldByPattern(deidentifiedFields[47])
    }
    
    // OBR-48: Medically Necessary Duplicate Procedure Reason (can keep - not PHI)
    
    // OBR-49: Result Handling (can keep - not PHI)
    
    // OBR-50: Parent Universal Service Identifier (can keep - not PHI)
    
    return deidentifiedFields.join('|')
  }
  
  // OBX - Observation/Result Segment (may contain identifiers)
  if (segmentType === 'OBX') {
    const deidentifiedFields = [...fields]
    
    // OBX-2: Value Type (can keep - not PHI)
    
    // OBX-3: Observation Identifier (can keep - not PHI)
    
    // OBX-4: Observation Sub-ID (can keep - not PHI)
    
    // OBX-5: Observation Value (may contain PHI)
    if (deidentifiedFields[5]) {
      // Handle repeating values
      const values = deidentifiedFields[5].split('~')
      deidentifiedFields[5] = values.map(value => {
        // Check for various PHI patterns
        return deidentifyFieldByPattern(value)
      }).join('~')
    }
    
    // OBX-6: Units (can keep - not PHI)
    
    // OBX-7: References Range (can keep - not PHI)
    
    // OBX-8: Abnormal Flags (can keep - not PHI)
    
    // OBX-9: Probability (can keep - not PHI)
    
    // OBX-10: Nature of Abnormal Test (can keep - not PHI)
    
    // OBX-11: Observation Result Status (can keep - not PHI)
    
    // OBX-12: Date/Time of the Observation
    if (deidentifiedFields[12]) {
      deidentifiedFields[12] = deidentifyDate(deidentifiedFields[12])
    }
    
    // OBX-13: Producer's ID (may contain name)
    if (deidentifiedFields[13]) {
      const producers = deidentifiedFields[13].split('~')
      deidentifiedFields[13] = producers.map(producer => {
        if (producer.includes('^')) {
          const parts = producer.split('^')
          parts[0] = deidentifyIdentifier(parts[0])
          if (parts.length > 1) parts[1] = deidentifyName(parts[1])
          if (parts.length > 2) parts[2] = deidentifyName(parts[2])
          return parts.join('^')
        }
        return deidentifyIdentifier(producer)
      }).join('~')
    }
    
    // OBX-14: Responsible Observer (may contain name)
    if (deidentifiedFields[14]) {
      const observers = deidentifiedFields[14].split('~')
      deidentifiedFields[14] = observers.map(observer => {
        if (observer.includes('^')) {
          const parts = observer.split('^')
          parts[0] = deidentifyIdentifier(parts[0])
          if (parts.length > 1) parts[1] = deidentifyName(parts[1])
          if (parts.length > 2) parts[2] = deidentifyName(parts[2])
          return parts.join('^')
        }
        return deidentifyName(observer, 'provider')
      }).join('~')
    }
    
    // OBX-15: Observation Method (can keep - not PHI)
    
    // OBX-16: Equipment Instance Identifier
    if (deidentifiedFields[16]) {
      const identifiers = deidentifiedFields[16].split('~')
      deidentifiedFields[16] = identifiers.map(id => deidentifyDeviceIdentifier(id)).join('~')
    }
    
    // OBX-17: Date/Time of the Analysis
    if (deidentifiedFields[17]) {
      deidentifiedFields[17] = deidentifyDate(deidentifiedFields[17])
    }
    
    // OBX-18: Performing Organization Name (may be identifying)
    if (deidentifiedFields[18]) {
      deidentifiedFields[18] = deidentifyFieldByPattern(deidentifiedFields[18])
    }
    
    // OBX-19: Performing Organization Address
    if (deidentifiedFields[19]) {
      const addresses = deidentifiedFields[19].split('~')
      deidentifiedFields[19] = addresses.map(addr => deidentifyAddress(addr)).join('~')
    }
    
    // OBX-20: Performing Organization Medical Director (may contain name)
    if (deidentifiedFields[20]) {
      const directors = deidentifiedFields[20].split('~')
      deidentifiedFields[20] = directors.map(director => {
        if (director.includes('^')) {
          const parts = director.split('^')
          parts[0] = deidentifyIdentifier(parts[0])
          if (parts.length > 1) parts[1] = deidentifyName(parts[1])
          if (parts.length > 2) parts[2] = deidentifyName(parts[2])
          return parts.join('^')
        }
        return deidentifyName(director, 'provider')
      }).join('~')
    }
    
    // OBX-21: Patient Results Release Category (can keep - not PHI)
    
    // OBX-22: Date/Time Patient Results Released
    if (deidentifiedFields[22]) {
      deidentifiedFields[22] = deidentifyDate(deidentifiedFields[22])
    }
    
    // OBX-23: Performing Organization Phone Number
    if (deidentifiedFields[23]) {
      const phones = deidentifiedFields[23].split('~')
      deidentifiedFields[23] = phones.map(phone => deidentifyPhone(phone, true)).join('~')
    }
    
    return deidentifiedFields.join('|')
  }
  
  // NTE - Notes and Comments Segment
  if (segmentType === 'NTE') {
    const deidentifiedFields = [...fields]
    
    // NTE-2: Source of Comment (can keep - not PHI)
    
    // NTE-3: Comment (may contain PHI - needs careful de-identification)
    if (deidentifiedFields[3]) {
      // Handle repeating comments
      const comments = deidentifiedFields[3].split('~')
      deidentifiedFields[3] = comments.map(comment => {
        // De-identify any PHI patterns found in free text
        return deidentifyFieldByPattern(comment)
      }).join('~')
    }
    
    return deidentifiedFields.join('|')
  }
  
  // AL1 - Patient Allergy Information Segment
  if (segmentType === 'AL1') {
    const deidentifiedFields = [...fields]
    
    // AL1-4: Allergy Reaction Code (can keep - not PHI)
    
    // AL1-5: Identification Date
    if (deidentifiedFields[5]) {
      deidentifiedFields[5] = deidentifyDate(deidentifiedFields[5])
    }
    
    return deidentifiedFields.join('|')
  }
  
  // EVN - Event Type Segment
  if (segmentType === 'EVN') {
    const deidentifiedFields = [...fields]
    
    // EVN-2: Recorded Date/Time
    if (deidentifiedFields[2]) {
      deidentifiedFields[2] = deidentifyDate(deidentifiedFields[2])
    }
    
    // EVN-4: Event Occurred
    if (deidentifiedFields[4]) {
      deidentifiedFields[4] = deidentifyDate(deidentifiedFields[4])
    }
    
    // EVN-5: Event Facility (may be identifying)
    if (deidentifiedFields[5]) {
      deidentifiedFields[5] = deidentifyFieldByPattern(deidentifiedFields[5])
    }
    
    // EVN-6: Event Operator (may contain name)
    if (deidentifiedFields[6]) {
      const operators = deidentifiedFields[6].split('~')
      deidentifiedFields[6] = operators.map(operator => {
        if (operator.includes('^')) {
          const parts = operator.split('^')
          parts[0] = deidentifyIdentifier(parts[0])
          if (parts.length > 1) parts[1] = deidentifyName(parts[1])
          if (parts.length > 2) parts[2] = deidentifyName(parts[2])
          return parts.join('^')
        }
        return deidentifyName(operator, 'provider')
      }).join('~')
    }
    
    return deidentifiedFields.join('|')
  }
  
  // For other segment types, apply pattern-based de-identification to all fields
  // This catches any PHI that might be in segments we haven't explicitly handled
  const deidentifiedFields = [...fields]
  for (let i = 1; i < deidentifiedFields.length; i++) {
    if (deidentifiedFields[i] && deidentifiedFields[i].trim() !== '') {
      // Apply pattern-based de-identification
      const original = deidentifiedFields[i]
      const deidentified = deidentifyFieldByPattern(original)
      if (deidentified !== original) {
        deidentifiedFields[i] = deidentified
      }
    }
  }
  
  return deidentifiedFields.join('|')
}

/**
 * De-identifies an entire HL7 message
 * @param {string} hl7Message - Raw HL7 message string
 * @returns {string} De-identified HL7 message
 */
export function deidentifyHL7Message(hl7Message) {
  if (!hl7Message || hl7Message.trim() === '') {
    throw new Error('HL7 message is empty')
  }
  
  // Reset maps and counters for new message
  resetDeidentificationMaps()
  
  // Split message into segments (segments are separated by \r or \n)
  const segments = hl7Message
    .split(/\r?\n/)
    .map(seg => seg.trim())
    .filter(seg => seg.length > 0)
  
  // De-identify each segment
  const deidentifiedSegments = segments.map(segment => 
    deidentifySegment(segment)
  )
  
  // Rejoin segments with \r (standard HL7 line break)
  return deidentifiedSegments.join('\r')
}

/**
 * Validates that an HL7 message has the basic structure
 * @param {string} hl7Message - HL7 message string
 * @returns {boolean} True if message appears valid
 */
export function validateHL7Message(hl7Message) {
  if (!hl7Message || hl7Message.trim() === '') {
    return false
  }
  
  // Check for MSH segment (required in all HL7 messages)
  const hasMSH = hl7Message.trim().startsWith('MSH')
  
  // Check for pipe delimiters (required in HL7)
  const hasDelimiters = hl7Message.includes('|')
  
  return hasMSH && hasDelimiters
}

/**
 * Gets a sample ADT message for testing
 * This comprehensive sample includes multiple segments with various PHI types
 * @returns {string} Sample ADT^A01 message
 */
export function getSampleADTMessage() {
  return `MSH|^~\\&|SendingApp|SendingFacility|ReceivingApp|ReceivingFacility|20240101120000||ADT^A01^ADT_A01|12345|P|2.5
EVN|A01|20240101120000|20240101120000|EVENT_FACILITY|OPERATOR^JOHN^DOE^MD
PID|1||MRN123456789^^^HOSPITAL^MR||DOE^JOHN^MIDDLE^JR^^L||19800115|M|||123 MAIN ST^^CITY^ST^12345^USA||555-123-4567^PH^555-987-6543^CP|||123-45-6789||DL123456789^CA^20250101|SMITH^MARY|||BIRTHPLACE^CITY^CA^90210^USA
NK1|1|SMITH^JANE^M^||WIFE|456 SECOND ST^^CITY^ST^67890^USA|555-987-6543^PH|555-111-2222^CP|||20200101|NURSE|123456|EMPLOYER_NAME|M|19800115
PV1|1|I|ICU^101^A|||123456^DOCTOR^JOHN^MD^^MD|789012^REFERRING^JANE^MD^^MD|345678^CONSULTING^BOB^MD^^MD|SUR|987654^ADMITTING^ALICE^MD^^MD|||||123456789|||V123456||20240101100000|20240101120000|VISIT_DESCRIPTION
IN1|1|INS001|INS_COMPANY_ID|Insurance Company Name|123 INSURANCE ST^^CITY^ST^12345^USA|CONTACT^PERSON^NAME|555-111-2222|GROUP123|GROUP_NAME|EMP123|EMPLOYER_NAME|20200101|20251231|AUTH_INFO|PPO|INSURED^PATIENT^NAME|SPOUSE|19750115|789 INSURED ST^^CITY^ST^54321^USA|Y|N|Y|20240101|20240101|Y|20240101120000|VERIFIER^NAME^MD|PPO|Y|100|50|200|150|FULL|M|456 EMPLOYER ST^^CITY^ST^67890^USA|VERIFIED|OLD_PLAN|INDIVIDUAL|N|POLICY123|Y|20240101|BIRTHPLACE^CITY^CA^90210^USA|N
OBR|1||LAB123^LAB_TEST^LN|20240101120000|20240101130000|COLLECTOR^ID^NAME|Y||CLINICAL_INFO|20240101120000|BLOOD|123456^ORDERING^PROVIDER^MD|555-222-3333|PLACER1|PLACER2|FILLER1|FILLER2|20240101130000|N|LAB|F|N|N|20240101120000|COPYTO^NAME^MD|N|AMB|REASON|INTERPRETER^ID^NAME^MD|ASSISTANT^ID^NAME^MD|TECH^ID^NAME^MD|TRANSCRIBER^ID^NAME^MD|20240101100000|1|LOGISTICS|COMMENT|Y|Y|N|TRANSPORT_COMMENT|PROC001|MODIFIER|PLACER_SUPP|FILLER_SUPP|N|EMAIL|PARENT_ID
OBX|1|NM|HR^Heart Rate^LN||72|/min^beats per minute^UCUM|N|||F|||20240101120000|PRODUCER^ID^NAME^MD|OBSERVER^ID^NAME^MD|METHOD|DEVICE123|20240101120000|ORG_NAME|789 ORG ST^^CITY^ST^45678^USA|DIRECTOR^ID^NAME^MD|Y|20240101120000|555-333-4444
NTE|1|L|This is a comment with patient name JOHN DOE and phone 555-123-4567 and email john.doe@example.com and URL https://example.com and IP 192.168.1.1`
}