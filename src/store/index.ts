import { defineStore } from 'pinia'

/** main 相当于为容器起一个名字 */
export const useStore = defineStore('main', {
    state: () => {
        return {
            msg: 'Hello Pinia'
        }
    },
    getters: {},
    actions: {}
})
