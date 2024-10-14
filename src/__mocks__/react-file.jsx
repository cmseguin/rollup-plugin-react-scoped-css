import React from 'react';

const SubComponent = () => <div>SubComponent</div>;

export default function MyComponent() {
  const props = { foo: 'bar', baz: 'qux' };
  return <>
    <div className="test" {...props}>
      <p {...props}>Hello World</p>
      <SubComponent />
    </div>
  </>;
}