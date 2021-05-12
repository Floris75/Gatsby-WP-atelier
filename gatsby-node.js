const path = require(`path`)
const chunk = require(`lodash/chunk`)

// This is a simple debugging tool
// dd() will prettily dump to the terminal and kill the process
// const { dd } = require(`dumper.js`)

/**
 * exports.createPages is a built-in Gatsby Node API.
 * It's purpose is to allow you to create pages for your site! 💡
 *
 * See https://www.gatsbyjs.com/docs/node-apis/#createPages for more info.
 */
exports.createPages = async gatsbyUtilities => {
  // Query our posts from the GraphQL server

  const graphqlResult = await gatsbyUtilities.graphql(/* GraphQL */ `
    {
      wp {
        readingSettings {
          postsPerPage
        }
      }
      frontPage: allWpPage(filter: { isFrontPage: { eq: true } }) {
        nodes {
          uri
        }
      }
      postsPage: allWpPage(filter: { isPostsPage: { eq: true } }) {
        nodes {
          uri
        }
      }
    }
  `)
  const { postsPerPage } = graphqlResult.data.wp.readingSettings

  const postsPath = graphqlResult.data.postsPage.nodes.length
    ? graphqlResult.data.postsPage.nodes[0].uri
    : graphqlResult.data.frontPage.nodes.length
    ? false
    : "/"

  await Promise.all([
    createPosts(gatsbyUtilities, postsPerPage, postsPath),
    createStaticPages(gatsbyUtilities),
    createTags(gatsbyUtilities, postsPerPage),
    createCategories(gatsbyUtilities, postsPerPage),
  ])
}

const createPosts = async (gatsbyUtilities, postsPerPage, postsPath) => {
  const posts = await getPosts(gatsbyUtilities)

  // If there are no posts in WordPress, don't do anything
  if (posts.length) {
    await createIndividualBlogPostPages({ posts, gatsbyUtilities })
    if (postsPath) {
      await createBlogPostArchive({
        posts,
        gatsbyUtilities,
        postsPerPage,
        postsPath,
      })
    }
  }
}

const createStaticPages = async gatsbyUtilities => {
  const pages = await getPages(gatsbyUtilities)
  if (pages.length) {
    await createIndividualPages({ pages, gatsbyUtilities })
  }
}

const createTags = async (gatsbyUtilities, postsPerPage) => {
  const tags = await getTags(gatsbyUtilities)
  await createTagsArchive({ tags, gatsbyUtilities, postsPerPage })
}

const createCategories = async (gatsbyUtilities, postsPerPage) => {
  const categories = await getCategories(gatsbyUtilities)
  await createCategoriesArchive({ categories, gatsbyUtilities, postsPerPage })
}

/**
 * This function creates all the individual blog pages in this site
 */
const createIndividualBlogPostPages = async ({ posts, gatsbyUtilities }) =>
  Promise.all(
    posts.map(({ previous, post, next }) =>
      // createPage is an action passed to createPages
      // See https://www.gatsbyjs.com/docs/actions#createPage for more info
      gatsbyUtilities.actions.createPage({
        // Use the WordPress uri as the Gatsby page path
        // This is a good idea so that internal links and menus work 👍
        path: post.uri,

        // use the blog post template as the page component
        component: path.resolve(`./src/templates/blog-post.js`),

        // `context` is available in the template as a prop and
        // as a variable in GraphQL.
        context: {
          // we need to add the post id here
          // so our blog post template knows which blog post
          // the current page is (when you open it in a browser)
          id: post.id,

          // We also use the next and previous id's to query them and add links!
          previousPostId: previous ? previous.id : null,
          nextPostId: next ? next.id : null,
        },
      })
    )
  )

const createIndividualPages = async ({ pages, gatsbyUtilities }) =>
  Promise.all(
    pages
      .filter(({ page }) => !page.isPostsPage)
      .map(({ page }) =>
        // createPage is an action passed to createPages
        // See https://www.gatsbyjs.com/docs/actions#createPage for more info
        gatsbyUtilities.actions.createPage({
          // Use the WordPress uri as the Gatsby page path
          // This is a good idea so that internal links and menus work 👍
          path: page.uri,

          // use the blog post template as the page component
          component: path.resolve(`./src/templates/page.js`),

          // `context` is available in the template as a prop and
          // as a variable in GraphQL.
          context: {
            // we need to add the post id here
            // so our blog post template knows which blog post
            // the current page is (when you open it in a browser)
            id: page.id,
          },
        })
      )
  )

/**
 * This function creates all the individual blog pages in this site
 */
async function createBlogPostArchive({
  posts,
  gatsbyUtilities,
  postsPerPage,
  postsPath,
}) {
  const postsChunkedIntoArchivePages = chunk(posts, postsPerPage)
  const totalPages = postsChunkedIntoArchivePages.length

  return Promise.all(
    postsChunkedIntoArchivePages.map(async (_posts, index) => {
      const pageNumber = index + 1

      const getPagePath = page => {
        if (page > 0 && page <= totalPages) {
          // Since our homepage is our blog page
          // we want the first page to be "/" and any additional pages
          // to be numbered.
          // "/blog/2" for example
          return page === 1 ? postsPath : `${postsPath}page/${page}`
        }

        return null
      }

      // createPage is an action passed to createPages
      // See https://www.gatsbyjs.com/docs/actions#createPage for more info
      await gatsbyUtilities.actions.createPage({
        path: getPagePath(pageNumber),

        // use the blog post archive template as the page component
        component: path.resolve(`./src/templates/blog-post-archive.js`),

        // `context` is available in the template as a prop and
        // as a variable in GraphQL.
        context: {
          // the index of our loop is the offset of which posts we want to display
          // so for page 1, 0 * 10 = 0 offset, for page 2, 1 * 10 = 10 posts offset,
          // etc
          offset: index * postsPerPage,

          // We need to tell the template how many posts to display too
          postsPerPage,

          nextPagePath: getPagePath(pageNumber + 1),
          previousPagePath: getPagePath(pageNumber - 1),
        },
      })
    })
  )
}

/**
 * This function creates all the individual blog pages in this site
 */
async function createTagsArchive({ tags, gatsbyUtilities, postsPerPage }) {
  return Promise.all(
    tags
      .filter(({ tag }) => tag.count)
      .map(({ tag }) => {
        const postsChunkedIntoArchivePages = chunk(
          tag.posts.nodes,
          postsPerPage
        )
        const totalPages = postsChunkedIntoArchivePages.length

        return Promise.all(
          postsChunkedIntoArchivePages.map(async (_posts, index) => {
            const pageNumber = index + 1

            const getPagePath = page => {
              if (page > 0 && page <= totalPages) {
                return page === 1 ? `${tag.uri}` : `${tag.uri}page/${page}`
              }

              return null
            }

            // createPage is an action passed to createPages
            // See https://www.gatsbyjs.com/docs/actions#createPage for more info
            await gatsbyUtilities.actions.createPage({
              path: getPagePath(pageNumber),

              // use the blog post archive template as the page component
              component: path.resolve(`./src/templates/tag.js`),

              // `context` is available in the template as a prop and
              // as a variable in GraphQL.
              context: {
                offset: index * postsPerPage,
                slug: tag.slug,
                postsPerPage,
                nextPagePath: getPagePath(pageNumber + 1),
                previousPagePath: getPagePath(pageNumber - 1),
              },
            })
          })
        )
      })
  )
}

async function createCategoriesArchive({
  categories,
  gatsbyUtilities,
  postsPerPage,
}) {
  return Promise.all(
    categories
      .filter(({ category }) => category.count)
      .map(({ category }) => {
        const postsChunkedIntoArchivePages = chunk(
          category.posts.nodes,
          postsPerPage
        )
        const totalPages = postsChunkedIntoArchivePages.length

        return Promise.all(
          postsChunkedIntoArchivePages.map(async (_posts, index) => {
            const pageNumber = index + 1

            const getPagePath = page => {
              if (page > 0 && page <= totalPages) {
                return page === 1
                  ? `${category.uri}`
                  : `${category.uri}page/${page}`
              }

              return null
            }

            // createPage is an action passed to createPages
            // See https://www.gatsbyjs.com/docs/actions#createPage for more info
            await gatsbyUtilities.actions.createPage({
              path: getPagePath(pageNumber),

              // use the blog post archive template as the page component
              component: path.resolve(`./src/templates/category.js`),

              // `context` is available in the template as a prop and
              // as a variable in GraphQL.
              context: {
                // the index of our loop is the offset of which posts we want to display
                // so for page 1, 0 * 10 = 0 offset, for page 2, 1 * 10 = 10 posts offset,
                // etc
                offset: index * postsPerPage,
                slug: category.slug,
                // We need to tell the template how many posts to display too
                postsPerPage,

                nextPagePath: getPagePath(pageNumber + 1),
                previousPagePath: getPagePath(pageNumber - 1),
              },
            })
          })
        )
      })
  )
}

/**
 * This function queries Gatsby's GraphQL server and asks for
 * All WordPress blog posts. If there are any GraphQL error it throws an error
 * Otherwise it will return the posts 🙌
 *
 * We're passing in the utilities we got from createPages.
 * So see https://www.gatsbyjs.com/docs/node-apis/#createPages for more info!
 */
async function getPosts({ graphql, reporter }) {
  const graphqlResult = await graphql(/* GraphQL */ `
    query WpPosts {
      # Query all WordPress blog posts sorted by date
      allWpPost(sort: { fields: [date], order: DESC }) {
        edges {
          previous {
            id
          }

          # note: this is a GraphQL alias. It renames "node" to "post" for this query
          # We're doing this because this "node" is a post! It makes our code more readable further down the line.
          post: node {
            id
            uri
          }

          next {
            id
          }
        }
      }
    }
  `)

  if (graphqlResult.errors) {
    reporter.panicOnBuild(
      `There was an error loading your blog posts`,
      graphqlResult.errors
    )
    return
  }

  return graphqlResult.data.allWpPost.edges
}

async function getPages({ graphql, reporter }) {
  const graphqlResult = await graphql(/* GraphQL */ `
    query WpPages {
      # Query all WordPress blog posts sorted by date
      allWpPage {
        edges {
          # note: this is a GraphQL alias. It renames "node" to "post" for this query
          # We're doing this because this "node" is a post! It makes our code more readable further down the line.
          page: node {
            id
            uri
            isPostsPage
          }
        }
      }
    }
  `)

  if (graphqlResult.errors) {
    reporter.panicOnBuild(
      `There was an error loading your blog pages`,
      graphqlResult.errors
    )
    return
  }

  return graphqlResult.data.allWpPage.edges
}

async function getTags({ graphql, reporter }) {
  const graphqlResult = await graphql(/* GraphQL */ `
    query WpTags {
      # Query all WordPress blog posts sorted by date
      allWpTag {
        edges {
          # note: this is a GraphQL alias. It renames "node" to "post" for this query
          # We're doing this because this "node" is a post! It makes our code more readable further down the line.
          tag: node {
            id
            uri
            slug
            count
            posts {
              nodes {
                id
              }
            }
          }
        }
      }
    }
  `)

  if (graphqlResult.errors) {
    reporter.panicOnBuild(
      `There was an error loading your blog tags`,
      graphqlResult.errors
    )
    return
  }
  return graphqlResult.data.allWpTag.edges
}

async function getCategories({ graphql, reporter }) {
  const graphqlResult = await graphql(/* GraphQL */ `
    query WpCategories {
      # Query all WordPress blog posts sorted by date
      allWpCategory {
        edges {
          # note: this is a GraphQL alias. It renames "node" to "category" for this query
          # We're doing this because this "node" is a post! It makes our code more readable further down the line.
          category: node {
            id
            uri
            slug
            count
            posts {
              nodes {
                id
              }
            }
          }
        }
      }
    }
  `)

  if (graphqlResult.errors) {
    reporter.panicOnBuild(
      `There was an error loading your blog categories`,
      graphqlResult.errors
    )
    return
  }
  return graphqlResult.data.allWpCategory.edges
}
