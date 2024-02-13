import Resolver from '@forge/resolver';
import api, { route } from "@forge/api";

const resolver = new Resolver();

function isIterable(obj) {
  return obj != null && typeof obj[Symbol.iterator] === 'function';
}

async function categoryfilter(spaces, categoryName) {
  let productSpecSpaces = [];
  let categories;
  for (const space of spaces) {
    categories = space.metadata.labels.results || [];
    if(isIterable(categories)) {
      for (const category of categories) {
        if (category.name === categoryName) {
          productSpecSpaces.push(space);
          break;
        }
      }
    }
  }

  return productSpecSpaces;
};

function getStart(nextURL) {
  const paramsString = nextURL.split('?')[1];
  const searchParams = new URLSearchParams(paramsString);
  const cursorValue = searchParams.get('start');
  return cursorValue;
}

async function getConfluenceSpaces(next){
  const url = next
    ? route`wiki/rest/api/space?next=true&start=${getStart(next)}&type=global&expand=metadata.labels,icon,homepage`
    : route`wiki/rest/api/space?type=global&expand=metadata.labels,icon,homepage`;
  const response = await api.asUser().requestConfluence(url, {
    headers: {
      'Accept': 'application/json'
    }
  })
  const responseJson = await response.json();
  const nextLink = responseJson._links.next || undefined;
  const spaces = responseJson.results;
  return {
    next: nextLink,
    spaces: spaces
  }
}

async function getAllConfluenceSpaces() {
  console.log(`getAllConfluenceSpaces begin`);
  let allSpaces = [];
  let next, spaces = [];
  ({next, spaces} = await getConfluenceSpaces());
  allSpaces = [...spaces];
  while(next) {
    ({next, spaces} = await getConfluenceSpaces(next));
    allSpaces = [
      ...allSpaces,
      ...spaces
    ];
  }
  console.log(`getAllConfluenceSpaces end`);
  return allSpaces;
}

resolver.define('getCategorySpecificSpaces', async ({payload, context}) => {
  const spaces = await getAllConfluenceSpaces();
  const categorisedSpaces = await categoryfilter(spaces, payload.spaceCategory);

  return categorisedSpaces;
});

// PagePropertiesでスペースオーナーがあれば取得してくる。
resolver.define('getSpaceOwners', async({payload, context}) => {
  const spaces = payload.spaces;

  return spaces;
})

export const handler = resolver.getDefinitions();
