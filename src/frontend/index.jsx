import React, { useEffect, useState } from 'react';
import api, { route } from "@forge/api";
import ForgeReconciler, {
  Cell,
  Head,
  Image,
  Link,
  Row,
  Table,
  Text,
  TextField,
  User
} from '@forge/react';
import { view, invoke } from '@forge/bridge';

const defaultConfig = {
  spaceCategory: "プロダクト仕様"
}

const Config = () => {
  return (
    <>
      <TextField name="spaceCategory" label="Space Category" defaultValue={defaultConfig.spaceCategory} />
    </>
  );
};

const App = () => {
  const [spaces, setSpaces] = useState([]);
  const [context, setContext] = useState(undefined);

  let productSpecSpaces = [], tempFilteredSpaces = [];
  const config = context?.extension.config || defaultConfig;
  const spaceCategory = config?.spaceCategory;
  const spaceKeys = spaces.map((space) => space.key);

  useEffect(() => {
    view.getContext().then(setContext);
  }, []);
  useEffect(() => {
    invoke('getCategorySpecificSpaces', { spaceCategory: spaceCategory })
      .then(setSpaces);
  }, spaceCategory);
  useEffect(() => {
    if(spaces.length > 0) {
      invoke('getSpaceOwners', { spaces: spaces })
        .then(setSpaces);
    }
  }, [spaces.length]);
  console.log(`spaces: `);
  console.log(spaces);
  console.log(`ownerIdsOfSpace: `);
  console.log(spaces.map((space) => space.ownerIdsOfSpace));

  return (
    <Table>
      <Head>
        <Cell>
          <Text>Image </Text>
        </Cell>
        <Cell>
          <Text>Link </Text>
        </Cell>
        <Cell>
          <Text>Owner </Text>
        </Cell>
      </Head>
      {spaces && spaces.map(space => (
        <Row>
          <Cell>
            <Image src={`https://jira-freee.atlassian.net/wiki${space.icon.path}`} size="xsmall" />
          </Cell>
          <Cell>
            <Link href={`https://jira-freee.atlassian.net/wiki/spaces/${space.key}`}>
              {space.name}
            </Link>
          </Cell>
          <Cell>
            {space.ownerIdsOfSpace && space.ownerIdsOfSpace.length > 0
              ? space.ownerIdsOfSpace.map((id) => (
                <User accountId={id} />
              ))
              : <Text>Owner property is TBD</Text>}
          </Cell>
        </Row>
      ))}
    </Table>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
ForgeReconciler.addConfig(<Config />);
