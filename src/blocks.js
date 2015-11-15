import render from './render'

const RETURN_KEY = 13
const TAB_KEY = 9

export default class CodeMirrorBlocks {
  constructor(cm, parser) {
    this.cm = cm
    this.parser = parser
    this.ast = null
    this.blockMode = false

    this.cm.getWrapperElement().onkeydown = this.handleKeyDown.bind(this)
  }

  setBlockMode(mode) {
    if (mode === this.blockMode) {
      return
    }
    this.blockMode = mode
    if (this.blockMode) {
      this.render()
    } else {
      this.cm.getAllMarks().forEach(marker => marker.clear())
    }
  }

  toggleBlockMode() {
    this.setBlockMode(!this.blockMode)
  }

  _clearMarks() {
    let marks = this.cm.findMarks({line: 0, ch: 0}, {line: this.cm.lineCount(), ch: 0})
    for (let mark of marks) {
      mark.clear()
    }
  }

  render() {
    this.ast = this.parser.parse(this.cm.getValue())
    this._clearMarks()
    render(this.ast.rootNode, this.cm, this.didRenderNode.bind(this))
  }

  selectNode(node, nodeEl, event) {
    event.stopPropagation()
    nodeEl.classList.add('blocks-selected')
  }

  saveEdit(node, nodeEl, event) {
    nodeEl.onkeydown = null
    nodeEl.contentEditable = false
    nodeEl.classList.remove('blocks-editing')
    this.cm.replaceRange(nodeEl.innerText, node.from, node.to)
    this.render()
  }

  editWhiteSpace(whiteSpaceEl, node, nodeEl, event) {
    event.stopPropagation()
    whiteSpaceEl.contentEditable = true
    whiteSpaceEl.classList.add('blocks-editing')
    whiteSpaceEl.onblur = this.saveWhiteSpace.bind(this, whiteSpaceEl, node, nodeEl)
    whiteSpaceEl.onkeydown = function(e) {
      e.stopPropagation()
      e.codemirrorIgnore = true
      if (e.which == RETURN_KEY || e.which == TAB_KEY) {
        whiteSpaceEl.blur()
      }
    }
    let range = document.createRange()
    range.setStart(whiteSpaceEl, 0)
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(range)
  }

  saveWhiteSpace(whiteSpaceEl, node, nodeEl, event) {
    whiteSpaceEl.onkeydown = null
    whiteSpaceEl.contentEditable = false
    whiteSpaceEl.classList.remove('blocks-editing')
    this.cm.replaceRange(
      ' '+whiteSpaceEl.innerText, whiteSpaceEl.location, whiteSpaceEl.location)
    this.render()
  }

  editNode(node, nodeEl, event) {
    event.stopPropagation()
    nodeEl.contentEditable = true
    nodeEl.classList.add('blocks-editing')
    nodeEl.onblur = this.saveEdit.bind(this, node, nodeEl)
    nodeEl.onkeydown = function(e) {
      e.stopPropagation()
      e.codemirrorIgnore = true
      if (e.which == RETURN_KEY || e.which == TAB_KEY) {
        nodeEl.blur()
      }
    }
    let range = document.createRange()
    range.setStart(nodeEl, 0)
    range.setEnd(nodeEl, nodeEl.innerText.length)
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(range)
  }

  handleDragStart(node, nodeEl, event) {
    event.stopPropagation()
    nodeEl.classList.add('blocks-dragging')
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text', node.id)
  }

  handleDragEnter(node, nodeEl, event) {
    event.stopPropagation()
    event.target.classList.add('blocks-over-target')
  }

  handleDragLeave(node, nodeEl, event) {
    event.stopPropagation()
    event.target.classList.remove('blocks-over-target')
  }

  handleDrop(node, nodeEl, event) {
    event.codemirrorIgnore = true
    event.preventDefault()
    event.target.classList.remove('blocks-over-target')
    let sourceNode = this.ast.nodeMap.get(event.dataTransfer.getData('text'))
    let sourceNodeText = this.cm.getRange(sourceNode.from, sourceNode.to)
    let destination = event.target.location
    this.cm.operation(function() {
      if (this.cm.indexFromPos(sourceNode.from) < this.cm.indexFromPos(destination)) {
        this.cm.replaceRange(' '+sourceNodeText, destination, destination)
        this.cm.replaceRange('', sourceNode.from, sourceNode.to)
      } else {
        this.cm.replaceRange('', sourceNode.from, sourceNode.to)
        this.cm.replaceRange(' '+sourceNodeText, destination, destination)
      }
    }.bind(this))
    this.render()
  }

  didRenderNode(node, nodeEl) {
    switch (node.type) {
    case 'literal':
      nodeEl.ondblclick = this.editNode.bind(this, node, nodeEl)
      nodeEl.onclick = this.selectNode.bind(this, node, nodeEl)
      nodeEl.ondragstart = this.handleDragStart.bind(this, node, nodeEl)
      break
    case 'expression':
      nodeEl.onclick = this.selectNode.bind(this, node, nodeEl)
      nodeEl.ondragstart = this.handleDragStart.bind(this, node, nodeEl)

      // set up drop targets
      let dropTargetEls = nodeEl.querySelectorAll(
        `#${nodeEl.id} > .blocks-args > .blocks-drop-target`)
      for (let i = 0; i < dropTargetEls.length; i++) {
        let el = dropTargetEls[i]
        el.ondragenter = this.handleDragEnter.bind(this, node, nodeEl)
        el.ondragleave = this.handleDragLeave.bind(this, node, nodeEl)
        el.ondrop = this.handleDrop.bind(this, node, nodeEl)
      }

      // set up white space
      let whiteSpaceEls = nodeEl.querySelectorAll(
        `#${nodeEl.id} > .blocks-args > .blocks-white-space`)
      for (let i = 0; i < whiteSpaceEls.length; i++) {
        let el = whiteSpaceEls[i]
        el.onclick = this.editWhiteSpace.bind(this, el, node, nodeEl)
      }
      break
    }
  }

  handleKeyDown(e) {
  }

}