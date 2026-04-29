import { defineAppSetup } from 'valaxy'

export default defineAppSetup(() => {
  // 确保 MetingJS 播放器以固定模式显示
  if (typeof document !== 'undefined') {
    setTimeout(() => {
      const metingElement = document.querySelector('meting-js')
      if (metingElement) {
        metingElement.setAttribute('fixed', 'true')
        metingElement.setAttribute('list-folded', 'true')
      }
    }, 3000)
  }
})