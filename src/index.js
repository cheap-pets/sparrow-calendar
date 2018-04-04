import devq from 'sparrow-device-query'
import formatDate from './format-date'

const clickEvent = devq.isMobile ? 'tap' : 'click'

const template = `
  <div class="calendar-header">
    <span class="calendar-title"><span class="calendar-year"></span><span class="calendar-month"></span></span>
    <span class="year-hint" style="display: none;"></span>
    <span class="navi"><a class="icon icon-nav-left"></a><a class="icon icon-nav-right"></a></span>
  </div>
  <table class="calendar-body table-days">
    <thead></thead>
    <tbody></tbody>
  </table>
  <table class="calendar-body table-years">
  </table>
`
const isZh = (navigator.language || navigator.userLanguage).indexOf('zh') === 0
const MONTHS_SHORT = isZh
  ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEK_DAYS_SHORT = isZh ? ['日', '一', '二', '三', '四', '五', '六'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const YEAR_POSTFIX = isZh ? '年' : ''
const MONTH_POSTFIX = isZh ? '月' : ''
// const DATE_POSTFIX = isZh ? '日' : ''
// const WEEK_DAY_PREFIX = isZh ? '星期' : ''
const MAX_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function dispatchDateChangeEvent (event) {
  const e = document.createEvent('CustomEvent')
  e.initCustomEvent('dateselect', false, true)
  e.calendar = this
  e.date = this.date
  e.dateString = formatDate(this.date)
  this.el.dispatchEvent(e)
  event.stopPropagation()
  if (this.ondateselect) this.ondateselect(e)
}

function isLeapMonth (year, month) {
  return month === 1 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)
}
function daysOfTheMonth (year, month) {
  return isLeapMonth(year, month) ? 29 : MAX_DAYS[month]
}
function parse (date) {
  if (!date) return null
  if (typeof date === 'string') {
    date = new Date(Date.parse(date)) // date.replace(/-/g, '/')
  }
  const month = date.getMonth()
  return {
    do: date,
    year: date.getFullYear(),
    month,
    monthName: MONTHS_SHORT[month],
    date: date.getDate(),
    dayName: WEEK_DAYS_SHORT[date.getDay()]
  }
}
function navi (v) {
  let { year, month } = this.displayDate
  if (this.viewIdx === 1) {
    year += v * 12
    this.updateYears(year)
  } else {
    month += v
    if (month < 0) {
      month = 11
      year--
    } else if (month > 11) {
      month = 0
      year++
    }
    this.update(new Date(year, month, 1))
  }
}
function changeView (idx) {
  this.viewIdx = idx
  const el = this.el
  el.querySelector('.calendar-title').style.display = idx ? 'none' : 'inline-block'
  el.querySelector('.year-hint').style.display = idx ? 'inline-block' : 'none'
  const daysTable = el.querySelector('.calendar-body.table-days')
  const yearsTable = el.querySelector('.calendar-body.table-years')
  daysTable.style.display = idx ? 'none' : 'table'
  yearsTable.style.display = idx ? 'table' : 'none'
}

const today = parse(Date())

class Calendar {
  constructor (options) {
    const { el } = options || {}
    this.renderTo(el)
  }
  renderTo (el) {
    this.el = typeof el === 'string' ? document.querySelector(el) : el
    if (!this.el) return

    el.classList.add('calendar')
    el.innerHTML = template

    el.querySelector('.year-hint').innerText = isZh ? '选择年份 :' : 'select year :'
    el.querySelector('.calendar-year').addEventListener(clickEvent, () => {
      this.updateYears(this.displayDate.year)
      changeView.call(this, 1)
    })

    const prevMonth = el.querySelector('.icon-nav-left')
    const nextMonth = el.querySelector('.icon-nav-right')

    prevMonth.addEventListener(clickEvent, () => {
      navi.call(this, -1)
    })
    nextMonth.addEventListener(clickEvent, () => {
      navi.call(this, 1)
    })
    const daysTable = el.querySelector('.calendar-body.table-days')
    const thead = daysTable.querySelector('thead')
    WEEK_DAYS_SHORT.forEach(d => {
      const th = document.createElement('th')
      th.innerText = d
      thead.appendChild(th)
    })
    const tbody = daysTable.querySelector('tbody')
    const dayCells = []
    for (let i = 0; i < 6; i++) {
      const tr = document.createElement('tr')
      for (let j = 0; j < 7; j++) {
        const td = document.createElement('td')
        const cell = document.createElement('a')
        cell.addEventListener(clickEvent, (e) => {
          const d = parseInt(e.target.innerText)
          if (!isNaN(d)) {
            const { year, month } = this.displayDate
            this.date = new Date(year, month, d)
            if (this.activeCell) this.activeCell.classList.remove('active')
            e.target.classList.add('active')
            this.activeCell = e.target
            dispatchDateChangeEvent.call(this, e)
          }
        })
        td.appendChild(cell)
        tr.appendChild(td)
        dayCells.push(cell)
      }
      tbody.appendChild(tr)
    }
    this.dayCells = dayCells

    const yearsTable = el.querySelector('.calendar-body.table-years')
    const yearCells = []
    for (let i = 0; i < 3; i++) {
      const tr = document.createElement('tr')
      for (let j = 0; j < 4; j++) {
        const td = document.createElement('td')
        const cell = document.createElement('a')
        cell.addEventListener(clickEvent, ({ target }) => {
          const d = parseInt(target.innerText)
          if (!isNaN(d)) {
            const { month } = this.displayDate
            this.update(new Date(d, month, 1))
            changeView.call(this, 0)
          }
        })
        td.appendChild(cell)
        tr.appendChild(td)
        yearCells.push(cell)
      }
      yearsTable.appendChild(tr)
    }
    this.yearCells = yearCells

    this.update()
  }
  update (displayDate) {
    if (!this.el) return
    if (this.viewIdx !== 0) changeView.call(this, 0)
    this.displayDate = parse(displayDate || this.date || new Date())
    const { year, month } = this.displayDate

    this.el.querySelector('.calendar-year').innerText = year + YEAR_POSTFIX
    this.el.querySelector('.calendar-month').innerText = MONTHS_SHORT[month] + MONTH_POSTFIX

    const current = parse(this.date)
    const maxDays = daysOfTheMonth(year, month)
    const firstDay = new Date(year, month, 1).getDay()
    let n = 1
    this.activeCell = null
    for (let i = 0, len = this.dayCells.length; i < len; i++) {
      const cell = this.dayCells[i]
      cell.className = ''
      if (i >= firstDay && n <= maxDays) {
        cell.innerHTML = n
        if (current && year === current.year && month === current.month && n === current.date) {
          this.activeCell = cell
          cell.classList.add('active')
        }
        if (year === today.year && month === today.month && n === today.date) {
          cell.classList.add('today')
        }
        n++
      } else {
        cell.innerHTML = ''
      }
    }
  }
  updateYears (year) {
    this.displayDate.year = year
    const current = parse(this.date)
    let n = year - 5
    for (let i = 0, len = this.yearCells.length; i < len; i++) {
      const cell = this.yearCells[i]
      cell.className = (current && n === current.year) ? 'active' : ''
      cell.innerHTML = n
      n++
    }
  }
  setDate (date) {
    this.date = date
    this.update()
  }
}

export default Calendar
