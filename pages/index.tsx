import levels from '@/levels.fyi.json'
import styles from '@/styles/pages/Index.module.scss'
import { getInternships } from '@/utils/getInternships'
import { useEffect, useMemo, useState } from 'react'
import Select from 'react-select'
import { ApplicationStatus, Company, Internship } from '@/utils/types'
import { LOCK_EMOJI } from '@/utils/parse'

const closedTypeOptions = [
  { value: 'all', label: 'All' },
  { value: 'yes', label: 'Closed' },
  { value: 'no', label: 'Not Closed' },
]

const appliedTypeOptions = [
  { value: 'all', label: 'All' },
  { value: 'yes', label: 'Applied' },
  { value: 'no', label: 'Not Applied' },
]

const sponsorshipTypeOptions = [
  { value: 'all', label: 'All' },
  { value: 'citizenship', label: 'U.S Citizenship Not Required' },
  { value: 'sponsorship', label: 'May Offer Sponsorship' },
]

const statusTypeOptions = [
  { value: 'none', label: 'None' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'oa', label: 'Got OA' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'offer', label: 'Offer' },
]

const statusTypeMap: { [value: string]: (typeof statusTypeOptions)[0] } = {}
for (const option of statusTypeOptions) {
  statusTypeMap[option.value] = option
}

export default function Index() {
  const [darkMode, setDarkMode] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [closedType, setClosedType] = useState(closedTypeOptions[0])
  const [appliedType, setAppliedType] = useState(appliedTypeOptions[0])
  const [sponsorshipType, setSponsorshipType] = useState(
    sponsorshipTypeOptions[0]
  )
  const [companies, setCompanies] = useState<Company[] | null>(null)

  const filteredCompanies = useMemo(() => {
    if (!companies) return null

    const newCompanies = companies
      .map((company) => ({
        ...company,
        internships: company.internships.filter((internship) => {
          const closedMatch =
            closedType.value === 'all' ||
            (closedType.value === 'yes') === (internship.link === LOCK_EMOJI)

          const sponsorshipMatch =
            sponsorshipType.value === 'all' ||
            (sponsorshipType.value === 'citizenship' &&
              !internship.description.includes('🇺🇸')) ||
            (sponsorshipType.value === 'sponsorship' &&
              !internship.description.includes('🛂'))

          return closedMatch && sponsorshipMatch
        }),
      }))
      .filter((company) => {
        if (!company.internships.length) return false

        const { applied, internships, name } = company

        const appliedMatch =
          appliedType.value === 'all' ||
          (appliedType.value === 'yes') === applied

        const text = filterText.toLowerCase()
        const textMatch =
          !text ||
          name.toLowerCase().includes(text) ||
          internships.some(
            ({ description, locations }) =>
              description.toLowerCase().includes(text) ||
              locations.join('\n').toLowerCase().includes(text)
          )

        return appliedMatch && textMatch
      })

    if (flipped) newCompanies.reverse()
    return newCompanies
  }, [
    appliedType.value,
    closedType.value,
    companies,
    filterText,
    flipped,
    sponsorshipType.value,
  ])

  // initialize settings on start
  useEffect(() => {
    setDarkMode(window.localStorage.getItem('dark-mode') === 'yes')
    setFlipped(window.localStorage.getItem('flipped') === 'yes')
  }, [])

  async function getData() {
    setCompanies(null)

    const internships = await getInternships()

    const newCompanies: Company[] = []
    for (const internship of internships) {
      const company = newCompanies.find(
        ({ name }) => name === internship.company
      )
      if (company) {
        company.internships.push(internship)
      } else {
        newCompanies.push({
          name: internship.company,
          applied: getApplied(internship.company),
          status: getStatus(internship.company),
          internships: [internship],
        })
      }
    }

    setCompanies(newCompanies)

    function getApplied(company: string) {
      return window.localStorage.getItem(`Applied: ${company}`) === 'yes'
    }

    function getStatus(company: string) {
      return (window.localStorage.getItem(`Status: ${company}`) ??
        'none') as ApplicationStatus
    }
  }

  // get data on start
  useEffect(() => {
    getData()
  }, [])

  // updates applied status for given internship
  function updateApplied(applied: boolean, company: string) {
    if (!companies) return
    const newCompanies = companies.map((c) =>
      c.name === company ? { ...c, applied } : c
    )
    setCompanies(newCompanies)

    // update local storage
    window.localStorage.setItem(`Applied: ${company}`, applied ? 'yes' : 'no')
  }

  function updateStatus(status: ApplicationStatus, company: string) {
    if (!companies) return
    const newCompanies = companies.map((c) =>
      c.name === company ? { ...c, status } : c
    )
    setCompanies(newCompanies)

    // update local storage
    window.localStorage.setItem(`Status: ${company}`, status)
  }

  function toggleDarkMode() {
    const isDarkMode = !darkMode
    setDarkMode(isDarkMode)
    window.localStorage.setItem('dark-mode', isDarkMode ? 'yes' : 'no')
  }

  function toggleFlipped() {
    const isFlipped = !flipped
    setFlipped(isFlipped)
    window.localStorage.setItem('flipped', isFlipped ? 'yes' : 'no')
  }

  function getLevels(company: string) {
    const level: string | undefined = (levels as any)[company]
    if (!level) return null

    return (
      <a href={level} target='_blank' rel='noopener noreferrer'>
        🔗
      </a>
    )
  }

  function getLocations(company: Company) {
    const locations = company.internships.flatMap(
      (internship) => internship.locations
    )
    return locations.filter(
      (location, index) => locations.indexOf(location) === index
    )
  }

  return (
    <div
      className={
        darkMode ? `${styles.container} ${styles.darkMode}` : styles.container
      }
    >
      <h1>interning.dev (OFFSEASON FORK EDITION) </h1>
      <p>
        ⚠️ Not affiliated with{' '}
        <a
          href='https://pittcsc.org/'
          target='_blank'
          rel='noopener noreferrer'
        >
          PittCSC
        </a>
      </p>
      <ul>
        <li>
          Data from{' '}
          <a
            href='https://github.com/SimplifyJobs/Summer2024-Internships'
            target='_blank'
            rel='noopener noreferrer'
          >
            PittCSC
          </a>
        </li>
        <li>
          This dashboard is open source!{' '}
          <a
            href='https://github.com/csaye/interning.dev'
            target='_blank'
            rel='noopener noreferrer'
          >
            Star us on GitHub
          </a>
        </li>
        <li>
          Made by{' '}
          <a
            href='https://github.com/csaye'
            target='_blank'
            rel='noopener noreferrer'
          >
            Cooper Saye
          </a>
        </li>
      </ul>
      <div className={styles.buttons}>
        <button
          aria-label='Toggle ascending/descending order'
          onClick={() => toggleFlipped()}
        >
          {flipped ? '⬆️' : '⬇️'}
        </button>
        <button
          aria-label='Toggle dark/light mode'
          onClick={() => toggleDarkMode()}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
        <button
          aria-label='Refresh internship list'
          className={styles.refreshButton}
          onClick={() => getData()}
        >
          🔄
        </button>
      </div>
      {companies && (
        <p>
          You have applied to{' '}
          <b>
            {companies.filter((c) => c.applied).length}/{companies.length}
          </b>{' '}
          companies!
          {filteredCompanies && (
            <>
              {' '}
              (showing <b>{filteredCompanies.length}</b>)
            </>
          )}
        </p>
      )}
      <div className={styles.filters}>
        <input
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder='Filter by text...'
        />
        <span style={{ flexGrow: 1 }} />
        <label>
          <span>Closed?</span>
          <Select
            options={closedTypeOptions}
            value={closedType}
            onChange={(value) => {
              if (value) setClosedType(value)
            }}
            aria-label='Closed Type'
          />
        </label>
        <label>
          <span>Applied?</span>
          <Select
            options={appliedTypeOptions}
            value={appliedType}
            onChange={(value) => {
              if (value) setAppliedType(value)
            }}
            aria-label='Applied Type'
          />
        </label>
        <label>
          <span>Sponsorship?</span>
          <Select
            options={sponsorshipTypeOptions}
            value={sponsorshipType}
            onChange={(value) => {
              if (value) setSponsorshipType(value)
            }}
            aria-label='Sponsorship Type'
          />
        </label>
      </div>
      {!filteredCompanies ? (
        <p>Loading...</p>
      ) : !filteredCompanies.length ? (
        <p>No companies found</p>
      ) : (
        <div className={styles.table}>
          <div className={styles.row}>
            <div>Company</div>
            <div>Locations</div>
            <div>Internships</div>
            <div className={styles.small}>levels.fyi</div>
            <div className={styles.small}>Applied</div>
            <div className={styles.medium}>Status</div>
          </div>
          {filteredCompanies.map((company, i) => (
            <div
              className={
                company.applied
                  ? `${styles.row} ${styles.selected}`
                  : styles.row
              }
              key={i}
            >
              <div>{company.name}</div>
              <div className={styles.locations}>
                {getLocations(company).join('\n')}
              </div>
              <div>
                {company.internships.map((internship, i) => (
                  <InternshipData {...internship} key={i} />
                ))}
              </div>
              <div className={styles.small}>{getLevels(company.name)}</div>
              <div className={styles.small}>
                <input
                  checked={company.applied}
                  onChange={(e) =>
                    updateApplied(e.target.checked, company.name)
                  }
                  type='checkbox'
                  aria-label='Applied Status Checkbox'
                />
              </div>
              <div className={styles.medium}>
                <Select
                  options={statusTypeOptions}
                  value={statusTypeMap[company.status]}
                  onChange={(value) =>
                    updateStatus(
                      (value?.value ?? 'none') as ApplicationStatus,
                      company.name
                    )
                  }
                  aria-label='Application Status'
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className={styles.footer}>
        <button
          aria-label='Back to top of list'
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ⬆️
        </button>
      </div>
    </div>
  )
}

function InternshipData({ description, link }: Internship) {
  if (link === LOCK_EMOJI)
    return (
      <div>
        {LOCK_EMOJI} {description}
      </div>
    )

  return (
    <div>
      <a href={link} target='_blank' rel='noopener noreferrer'>
        {description}
      </a>
    </div>
  )
}
