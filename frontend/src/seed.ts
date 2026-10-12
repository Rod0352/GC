import type { Account, Bill, Community, Inquiry, Jurisdiction, Member, Poll, Post, Staff } from './api.ts'

// Demo data for presentations. Every person, office, bill and message here is fictional.
// Only api.ts reads this file. Times are relative to now so the demo never looks stale.

const ago = (days: number, hours = 0) => Date.now() - (days * 24 + hours) * 3_600_000

export const members: Member[] = [
  { id: 'jane-doe', name: 'Rep. Jane Doe', chamber: 'U.S. House', seat: 'VA-11', office: 'Office of Rep. Jane Doe' },
  { id: 'mark-roe', name: 'Sen. Mark Roe', chamber: 'U.S. Senate', seat: 'Virginia', office: 'Office of Sen. Mark Roe' },
  { id: 'amy-lee', name: 'Sen. Amy Lee', chamber: 'U.S. Senate', seat: 'Virginia', office: 'Office of Sen. Amy Lee' },
  { id: 'pat-quill', name: 'Rep. Pat Quill', chamber: 'U.S. House', seat: 'OH-03', office: 'Office of Rep. Pat Quill' },
]

// shortcut: one ZIP is mapped. Real lookups need an address service; other addresses resolve to their state only.
export const jurisdictions: Jurisdiction[] = [
  {
    zips: ['22030'],
    district: 'VA-11',
    county: 'Fairfax County',
    stateLeg: 'SD-37 · HD-40',
    reps: ['jane-doe', 'mark-roe', 'amy-lee'],
  },
]

export const bills: Bill[] = [
  {
    id: 'hr-2041',
    number: 'H.R. 2041',
    title: 'Veterans Housing Access Act',
    issue: 'Veterans',
    summary: 'Shortens VA home loan processing times and funds housing counselors at regional offices.',
    sponsor: 'jane-doe',
    stage: 2,
    actions: [
      { at: ago(64), text: 'Introduced in the House' },
      { at: ago(30), text: 'Reported by the Committee on Veterans’ Affairs' },
      { at: ago(2), text: 'Passed the House, 301–124' },
    ],
    votes: { 'jane-doe': 'Yea', 'pat-quill': 'Yea' },
  },
  {
    id: 's-518',
    number: 'S. 518',
    title: 'Rural Broadband Expansion Act',
    issue: 'Tech',
    summary: 'Funds last-mile broadband for counties where fewer than half of homes have a wired connection.',
    sponsor: 'mark-roe',
    stage: 1,
    actions: [
      { at: ago(41), text: 'Introduced in the Senate' },
      { at: ago(9), text: 'Hearing held by the Committee on Commerce' },
    ],
    votes: {},
  },
  {
    id: 'hr-733',
    number: 'H.R. 733',
    title: 'Community College Affordability Act',
    issue: 'Education',
    summary: 'Creates a federal match for states that cover two years of community college tuition.',
    sponsor: 'pat-quill',
    stage: 1,
    actions: [
      { at: ago(55), text: 'Introduced in the House' },
      { at: ago(5), text: 'Markup scheduled by the Committee on Education' },
    ],
    votes: {},
  },
  {
    id: 'hr-1290',
    number: 'H.R. 1290',
    title: 'Coastal Flood Resilience Act',
    issue: 'Climate',
    summary: 'Grants for flood barriers, drainage and buyouts in repeatedly flooded neighborhoods.',
    sponsor: 'jane-doe',
    stage: 0,
    actions: [{ at: ago(12), text: 'Introduced in the House' }],
    votes: {},
  },
  {
    id: 's-204',
    number: 'S. 204',
    title: 'Small Business Tax Simplification Act',
    issue: 'Taxes',
    summary: 'Raises the threshold for simplified filing and lets very small firms file once a year.',
    sponsor: 'amy-lee',
    stage: 3,
    actions: [
      { at: ago(120), text: 'Introduced in the Senate' },
      { at: ago(48), text: 'Passed the Senate, 68–31' },
      { at: ago(7), text: 'Passed the House, 255–170' },
    ],
    votes: { 'mark-roe': 'Nay', 'amy-lee': 'Yea', 'jane-doe': 'Yea', 'pat-quill': 'Nay' },
  },
]

export const posts: Post[] = [
  {
    id: 'post-1',
    on: 'member:jane-doe',
    by: 'Office of Rep. Jane Doe',
    text: 'Town hall on veterans housing this Thursday, 6:30 pm, at the Fairfax community center. Bring your questions.',
    at: ago(1, 3),
    status: 'published',
  },
  {
    id: 'post-2',
    on: 'member:jane-doe',
    by: 'Office of Rep. Jane Doe',
    text: 'Statement on H.R. 2041 passing the House: “Veterans should not wait months to close on a home.”',
    at: ago(0, 5),
    status: 'pending',
  },
  {
    id: 'post-3',
    on: 'member:mark-roe',
    by: 'Office of Sen. Mark Roe',
    text: 'The Commerce Committee heard testimony on S. 518 this week. Written testimony is open for 10 more days.',
    at: ago(8),
    status: 'published',
  },
  { id: 'post-4', on: 'bill:hr-2041', by: 'Maria T. · VA-11', text: 'My brother waited five months on his loan. Glad to see this move.', at: ago(1, 8) },
  { id: 'post-5', on: 'bill:hr-2041', by: 'Devon K. · VA-08', text: 'Does the counselor funding cover rural offices too?', at: ago(0, 20) },
  { id: 'post-6', on: 'community:va-11-neighbors', by: 'Priya S. · VA-11', text: 'Is anyone else going to the town hall on Thursday?', at: ago(0, 9) },
  { id: 'post-7', on: 'community:veterans-housing', by: 'Maria T. · VA-11', text: 'H.R. 2041 passed the House. Next stop is the Senate.', at: ago(1, 20) },
  {
    id: 'post-8',
    on: 'inquiry:inq-1',
    by: 'Office of Rep. Jane Doe',
    text: 'Thank you for writing. We have opened a case with the VA regional office and will update you within 10 days.',
    at: ago(3),
  },
]

export const polls: Poll[] = [
  {
    id: 'poll-1',
    by: 'jane-doe',
    question: 'Which issue should our next town hall cover?',
    at: ago(4),
    options: [
      ['Housing', 212],
      ['Veterans', 148],
      ['Education', 97],
      ['Transportation', 64],
    ],
  },
]

export const communities: Community[] = [
  { id: 'va-11-neighbors', name: 'VA-11 Neighbors', about: 'Local issues, town halls and meetups in the district.', members: 1284 },
  { id: 'veterans-housing', name: 'Veterans Housing Watch', about: 'Following housing legislation that affects veterans.', members: 432 },
  { id: 'school-funding', name: 'School Funding Forum', about: 'Budgets, bonds and tuition, from local boards to Congress.', members: 876 },
]

export const inquiries: Inquiry[] = [
  {
    id: 'inq-1',
    to: 'jane-doe',
    by: 'ivan@example.com',
    from: 'Ivan R. · VA-11',
    subject: 'VA home loan delay',
    issue: 'Veterans',
    text: 'My VA home loan has been in underwriting for four months. Can your office ask the regional office for a status?',
    at: ago(6),
    status: 'Answered',
  },
  {
    id: 'inq-2',
    to: 'jane-doe',
    by: 'maria@example.com',
    from: 'Maria T. · VA-11',
    subject: 'Flooding on Route 50',
    issue: 'Climate',
    text: 'Our street has flooded three times this year. Is there federal money the county can apply for?',
    at: ago(0, 6),
    status: 'New',
  },
  {
    id: 'inq-3',
    to: 'jane-doe',
    by: 'devon@example.com',
    from: 'Devon K. · VA-11',
    subject: 'Student aid form help',
    issue: 'Education',
    text: 'My aid application was rejected for a missing signature that I did provide. Who can I talk to?',
    at: ago(2),
    status: 'In progress',
  },
  {
    id: 'inq-4',
    to: 'jane-doe',
    by: 'priya@example.com',
    from: 'Priya S. · VA-11',
    subject: 'Small business permit backlog',
    issue: 'Economy',
    text: 'I have waited ten weeks for a federal permit to open my bakery. Is there anything your office can do?',
    at: ago(1, 2),
    status: 'New',
  },
]

export const staff: Staff[] = [
  { id: 'sarah-kim', office: 'jane-doe', name: 'Sarah Kim', title: 'Chief of Staff', level: 'Administrator', status: 'Active' },
  { id: 'alex-morgan', office: 'jane-doe', name: 'Alex Morgan', title: 'Legislative Assistant', level: 'Staff', status: 'Active' },
  { id: 'jordan-lee', office: 'jane-doe', name: 'Jordan Lee', title: 'Staff Assistant', level: 'Staff', status: 'Pending' },
]

const fairfax = { citizenship: 'citizen', lives: 'us', street: '123 Main St', city: 'Fairfax', state: 'VA', zip: '22030' }
const janesOffice = {
  office: 'Office of Rep. Jane Doe',
  level: 'Federal',
  branch: 'U.S. House of Representatives',
  member: 'Rep. Jane Doe (VA-11)',
  workspace: 'Legislative Affairs',
  identity: 'done',
}
const following = ['member:jane-doe', 'member:mark-roe', 'member:amy-lee']

/** Sign in with any of these on the sign-in screen. No password is checked. */
export const accounts: Account[] = [
  {
    label: 'Citizen',
    data: {
      id: 'ivan@example.com',
      firstName: 'Ivan',
      lastName: 'Rodriguez',
      ...fairfax,
      dob: '1990-04-12',
      issues: ['Veterans', 'Housing', 'Education'],
      contexts: ['personal'],
    },
    activity: {
      following: [...following, 'issue:Veterans', 'issue:Housing', 'issue:Education'],
      joined: ['veterans-housing'],
    },
  },
  {
    label: 'Office staff',
    data: {
      id: 'alex.morgan@mail.house.gov',
      firstName: 'Alex',
      lastName: 'Morgan',
      ...fairfax,
      dob: '1994-09-30',
      issues: ['Climate', 'Tech'],
      govEmail: 'alex.morgan@mail.house.gov',
      ...janesOffice,
      role: 'staff',
      title: 'Legislative Assistant',
      roleLevel: 'Staff',
      contexts: ['personal', 'office'],
    },
    activity: { following: [...following, 'issue:Climate', 'issue:Tech'] },
  },
  {
    label: 'Elected official',
    data: {
      id: 'jane.doe@mail.house.gov',
      firstName: 'Jane',
      lastName: 'Doe',
      ...fairfax,
      dob: '1975-02-18',
      govEmail: 'jane.doe@mail.house.gov',
      ...janesOffice,
      role: 'elected',
      title: 'Member of Congress',
      roleLevel: 'Owner',
      contexts: ['personal', 'office'],
    },
    activity: { following },
  },
]
