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
  return allSpaces;
}

resolver.define('getCategorySpecificSpaces', async ({payload, context}) => {
  const spaces = await getAllConfluenceSpaces();
  const categorisedSpaces = await categoryfilter(spaces, payload.spaceCategory);

  return categorisedSpaces;
});


async function getSpaceHomePageBody(space) {
  const spaceHomePageId = space.homepage.id;
  const response = await api.asUser().requestConfluence(route`/wiki/api/v2/pages/${spaceHomePageId}?body-format=storage`, {
    headers: {
      'Accept': 'application/json'
    }
  });

  console.log(`Response: ${response.status} ${response.statusText}`);
  const responsJson = await response.json();
  console.log(responsJson);
  const homePageBody = responsJson.body.storage.value;
  return homePageBody;
}

function getAccountIds(body){
  var pattern = /<ac:link><ri:user ri:account-id="([^"]*)" \/><\/ac:link>/g;
  var match;
  var accountIds = [];

  while ((match = pattern.exec(body)) !== null) {
    accountIds.push(match[1]);
  }

  console.log(accountIds);
  return accountIds;
}

// PagePropertiesでスペースオーナーがあれば取得してくる。
resolver.define('getSpaceOwners', async ({payload, context}) => {
  console.log(`getSpaceOwners begin`);
  let spaces = payload.spaces;
  console.log('spaces');
  console.log(spaces);

  for(let space of spaces) {
    // アカウントリストを取ってきているだけなので、多分オーナーというくらいでしかない。
    const ownerIdsOfSpace = getAccountIds((await getSpaceHomePageBody(space)));
    space.ownerIdsOfSpace = ownerIdsOfSpace;
  }

  console.log(`getSpaceOwners end`);
  return spaces;
})

export const handler = resolver.getDefinitions();
