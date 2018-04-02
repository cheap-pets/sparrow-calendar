export default function formatDate (date, format) {
  format = format || 'yyyy-MM-dd'
  let y = date.getFullYear()
  let o = {
    'M+': date.getMonth() + 1, // 月
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'S+': date.getMilliseconds() // 毫秒
  }
  if (/(y+)/.test(format)) {
    format = format.replace(RegExp.$1, ('' + y).substr(4 - RegExp.$1.length))
  }
  for (let k in o) {
    if (new RegExp('(' + k + ')').test(format)) {
      let v
      if (RegExp.$1.length === 2) {
        v = ('00' + o[k]).substr(('' + o[k]).length)
      } else if (RegExp.$1.length === 3) {
        v = ('000' + o[k]).substr(('' + o[k]).length)
      } else v = o[k]
      format = format.replace(RegExp.$1, v)
    }
  }
  return format
}
