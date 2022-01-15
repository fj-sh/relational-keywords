import * as playwright from 'playwright'
import { encodedUrl } from './utilities'

/**
 * 関連するキーワード
 */
export interface RelationalKeywords {
  baseKeyword: string
  relationalKeywords: string[]
}

/**
 * 階層付き関連キーワード
 */
export interface RelationalKeywordsWithLevel {
  level: number
  baseKeyword: string
  relationalKeywords: string[]
}

/**
 * 「他のキーワード」に表示されるキーワードの配列を返す。
 * @param keyword 検索キーワード
 * @returns 他のキーワードの配列
 */
export const getRelationalKeywords = async (keyword: string): Promise<string[]> => {
  const browser = await playwright.chromium.launch({
    headless: true,
  })
  const page = await browser.newPage({
    bypassCSP: true,
  })

  await page.goto(encodedUrl(keyword))

  const relationalKeywords = await page.evaluate(() => {
    const relationalKeywordsElements = document.querySelectorAll('.s75CSd')
    const searchKeywords = []
    relationalKeywordsElements.forEach((item: HTMLElement) => {
      searchKeywords.push(item.innerText)
    })
    return searchKeywords
  })

  await browser.close()
  return relationalKeywords
}

/**
 * キーワードの配列から関連キーワードを取得する。
 * @param keywords
 */
const getRelationalKeywordsFromKeywords = async (
  keywords: string[]
): Promise<RelationalKeywords[]> => {
  const relationalKeywordsPromises = []
  for (const keyword of keywords) {
    const relationalKeywordsWithBaseKeywordPromise = getRelationalKeywords(keyword).then(
      (relationalKeywords) => ({
          baseKeyword: keyword,
          relationalKeywords,
        })
    )
    relationalKeywordsPromises.push(relationalKeywordsWithBaseKeywordPromise)
  }
  const relationalKeywordsWithBaseKeywordResult = Promise.all(relationalKeywordsPromises).then(
    (relationalKeywordsWithBaseKeywordArray) => {
      let relationalKeywordsWithBaseKeywords = []
      for (const relationalKeywordsWithBaseKeyword of relationalKeywordsWithBaseKeywordArray) {
        relationalKeywordsWithBaseKeywords = [
          ...relationalKeywordsWithBaseKeywords,
          relationalKeywordsWithBaseKeyword,
        ]
      }
      return relationalKeywordsWithBaseKeywords
    }
  )
  return relationalKeywordsWithBaseKeywordResult
}

/**
 * 関連キーワードを3階層分、再帰的に取得する。
 * @param keyword
 */
export const getRelationalKeywordsRecursively = async (keyword: string) => {
  const relationalKeywords = await getRelationalKeywords(keyword)
  const firstRelationalKeywordsWithLevel = {
    level: 1,
    baseKeyword: keyword,
    relationalKeywords,
  }

  const secondRelationalKeywords = await getRelationalKeywordsFromKeywords(relationalKeywords)
  const secondRelationalKeywordsWithLevel = secondRelationalKeywords.map(
    (secondRelationalKeyword) => ({
        level: 2,
        baseKeyword: secondRelationalKeyword.baseKeyword,
        relationalKeywords: secondRelationalKeyword.relationalKeywords,
      })
  )

  const thirdRelationalKeywordsPromises = []
  for (const secondRelationalKeywordWithLevel of secondRelationalKeywordsWithLevel) {
    const thirdRelationalKeywordsPromise: Promise<RelationalKeywords[]> =
      getRelationalKeywordsFromKeywords(secondRelationalKeywordWithLevel.relationalKeywords).then(
        (relationalKeywordsFromKeywordsArray) => relationalKeywordsFromKeywordsArray
      )
    thirdRelationalKeywordsPromises.push(thirdRelationalKeywordsPromise)
  }
  const thirdResult = await Promise.all(thirdRelationalKeywordsPromises).then(
    (thirdRelationalKeywordsArray) => {
      let tmpThirdRelationalKeywords = []
      for (const thirdRelationalKeywords of thirdRelationalKeywordsArray) {
        tmpThirdRelationalKeywords = [...tmpThirdRelationalKeywords, ...thirdRelationalKeywords]
      }
      return tmpThirdRelationalKeywords.map((thirdRelationalKeywords) => ({
          level: 3,
          ...thirdRelationalKeywords,
        }))
    }
  )
  return [firstRelationalKeywordsWithLevel, ...secondRelationalKeywordsWithLevel, ...thirdResult]
}
