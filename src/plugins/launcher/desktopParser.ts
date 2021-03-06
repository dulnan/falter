// @ts-nocheck

export default class DesktopEntry {
  constructor(value) {
    this._regex = {
      comment: /([^#]*)#(.*)/g,
      group: /^\[(.+)\]\s*$/g,
      keyValuePair: /([A-Za-z0-9-]*)\s*(=)\s*(.*);?/g
    }

    if (typeof value === 'string') {
      this._path = value
      this._rawData = value
      this._decode()
    } else if (Object.prototype.toString.call(value) === '[object Object]') {
      this._path = null
      this._data = JSON.parse(JSON.stringify(value))
      this._encode()
    }
  }

  get JSON() {
    const keys = Object.keys(this._data)

    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === 'Desktop Entry') {
        const entries = this._data[keys[i]].entries

        const exec = entries.Exec?.value || ''
        const name = entries.Name?.value || ''
        const desc = entries.Comment?.value || ''
        const icon = entries.Icon?.value || ''
        const keywords = entries.Keywords?.value || []
        const categories = entries.Categories?.value || []

        return { name, exec, desc, icon, keywords, categories }
      }
    }
  }

  setValue(group, key, value) {
    this._createIfNotExists(group, key)

    this._data[group].entries[key].value = value
  }

  addValue(group, key, value) {
    this._createIfNotExists(group, key)

    if (Array.isArray(this._data[group].entries[key].value))
      this._data[group].entries[key].value.push(value)
    else
      this._data[group].entries[key].value = [
        this._data[group].entries[key].value,
        value
      ]
  }

  setComment(...args) {
    if (arguments.length == 3) {
      let [group, key, comment] = arguments
      this._createIfNotExists(group, key)
      this._data[group].entries[key].comment = comment
    } else if (arguments.length == 2) {
      let [group, comment] = arguments
      this._createIfNotExists(group)
      this._data[group].comment = comment
    }
  }

  setPrecedingComment(...args) {
    if (arguments.length == 3) {
      let [group, key, comment] = arguments
      if (!Array.isArray(comment)) throw 'PrecedingComment should be an array'
      this._createIfNotExists(group, key)
      this._data[group].entries[key].precedingComment = comment
    } else if (arguments.length == 2) {
      let [group, comment] = arguments
      if (!Array.isArray(comment)) throw 'PrecedingComment should be an array'
      //if (comment[0] !== "") comment.unshift("");
      this._createIfNotExists(group)
      this._data[group].precedingComment = comment
    }
  }

  save() {
    return this.saveTo(this._path)
  }

  saveTo(path) {
    this._encode()
    let _this = this
    return new Promise(function (resolve, reject) {
      fs.writeFileSync(path, _this._rawData, 'utf8', function (err) {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  _createIfNotExists(group, key) {
    if (key && !this._data[group].entries[key]) {
      this._data[group].entries[key] = {
        value: '',
        comment: '',
        precedingComment: []
      }
    } else if (!this._data[group]) {
      this._data[group] = { comment: '', precedingComment: '', entries: {} }
    }
  }

  /**
   * Encodes this._data to desktop entry this._rawData.
   * this._rawData is
   * @method _encode
   * @private
   */
  _encode() {
    var result = ''
    let data = this._data

    if (!data) {
      data = {}
    }

    // TODO: each group must have name key

    var groups = Object.keys(data)
    for (var i = 0; i < groups.length; i++) {
      var name = groups[i]
      var entries = data[name].entries
      var precedingComment = data[name].precedingComment
      var inlineComment = data[name].comment
      var pairs = Object.keys(entries)

      if (inlineComment.length > 0) inlineComment = '#' + inlineComment

      if (precedingComment[0] !== '') precedingComment.unshift('')
      precedingComment.forEach(function (comment) {
        if (comment.trim().length > 0) comment = '#' + comment
        result += comment + '\n'
      })

      result += `[${name}] ${inlineComment}\n`

      for (var j = 0; j < pairs.length; j++) {
        var key = pairs[j]
        var value = entries[key]

        if (Array.isArray(value.value)) {
          value.value = value.value.join(';')
        }

        if (
          Object.prototype.toString.call(value.value) === '[object Object]' ||
          Object.prototype.toString.call(value.comment) === '[object Object]'
        ) {
          continue
        }

        if (key === 'Exec') {
          value.value = `"${value.value}"`
        }

        value.precedingComment.forEach(function (comment) {
          if (comment.trim().length > 0) comment = '#' + comment
          result += comment + '\n'
        })

        if (value.comment.length > 0) value.comment = '#' + value.comment
        result += `${key} = ${value.value} ${value.comment}\n`
      }
    }

    this._rawData = result
  }

  /**
   * Decodes this._rawData desktop entry string to this._data.
   *
   * @method decode
   * @private
   */
  _decode() {
    var lines = this._rawData.split('\n')

    var groups = {}
    var group = null
    var precedingComment = []
    for (var i = 0; i < lines.length; i++) {
      let line = lines[i].trim()
      let comment = ''

      if (line.startsWith('#') || line == '') {
        precedingComment.push(line.replace(/^(#+)/, ''))
        continue
      }

      ;[line, comment] = this._stripComment(line)

      var newGroup = this._getNewGroup(line)
      if (newGroup) {
        group = newGroup
        if (precedingComment[0] === '') precedingComment.shift()
        groups[group] = {
          comment: comment,
          precedingComment: precedingComment,
          entries: {}
        }
        precedingComment = []
        continue
      }

      var pair = new RegExp(this._regex.keyValuePair).exec(line)
      if (pair) {
        var key = pair[1].trim()
        var value = pair[3].trim()

        if (key === 'Exec') {
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1)
          }
        } else {
          if (value.endsWith(';')) value = value.substr(0, value.length - 1)
          value = value.split(';')
          value = value.length > 1 ? value : value[0]
        }

        if (group) {
          if (precedingComment[0] === '') precedingComment.shift()
          groups[group].entries[key] = {
            value: value,
            comment: comment,
            precedingComment: precedingComment
          }
        }
        precedingComment = []
      }
    }

    this._data = groups
  }

  /**
   * Strips comment from rest of the line
   *
   * @method _stripComment
   * @param [line] {String} The line to strip.
   * @returns {Object}
   * @private
   */
  _stripComment(line) {
    var pair = new RegExp(this._regex.comment).exec(line)
    if (pair) {
      return [pair[1].trim(), pair[2]]
    }
    return [line, '']
  }

  /**
   * Checks whether a line indicates a new group or not.
   *
   * @method _getNewGroup
   * @param [line] {String} The line to check.
   * @returns {String} The Group name, if found.
   * @private
   */
  _getNewGroup(line) {
    var result = new RegExp(this._regex.group).exec(line || '')
    return result && result[1]
  }
}
