import { browser } from '@wdio/globals'

describe('Electron Application', () => {
    it('should print application title', async () => {
        // get the title of the page
        const title = await browser.getTitle()
        console.log('Title:', title)
        // get the application name from package.json
        const applicationName = require('../../package.json').productName
        expect(title).toBe(applicationName)
    })
})

describe('Applications page', () => {
    it('should show the application version', async () => {
        const body = await browser.$('body')
        const text = await body.getText()
        console.log('Body text:', text)
        const expectedVersion = require('../../package.json').version
        expect(text).toContain(expectedVersion)
    })

    it('should show that the backend is checked and shown as available after a short time', async () => {
        // check if docker is installed in os
        const { execSync } = require('child_process')
        try {
            execSync('docker --version')
        } catch (error) {
            console.error('Docker is not installed')
            return
        }

        // check if applications page displays "Checking backend" string in the body
        const body = await browser.$('body')
        const text = await body.getText()
        console.log('Body text:', text)
        expect(text).toContain('Checking backend...')

        // wait
        await browser.pause(1000)

        // should contain "Backend connected" string in the body
        const textAfterWait = await body.getText()
        console.log('Body text:', textAfterWait)
        expect(textAfterWait).toContain('Backend connected')
    })

    // it('should execute an analysis', async () => {
    //     // list links
    //     const links = await browser.$$('a')
    //     console.log('Links:', links)
    //     // click on the first link
    //     await links[6].click()
    //     await browser.pause(5000)
    //
    //     // should change the page
    //     const text = await browser.$('body').getText()
    //     console.log('Body text:', text)
    //     expect(text).toContain('Analysis')
    // })
})
