/**
 * キーワードをエンコードした検索 URL を返す。
 * @param keyword
 * @returns エンコードされた URL
 */
export const encodedUrl = (keyword: string) =>
  `https://www.google.com/search?q=${encodeURI(keyword)}`

/**
 * page で指定したページの検索URL
 * @param keyword
 * @param page
 */
export const urlWithSearchPage = (keyword: string, page) => {
  const PAGE_PARAM = '&start='
  const baseUrl = encodedUrl(keyword)
  return `${baseUrl}${PAGE_PARAM}${(page - 1) * 10}`
}
