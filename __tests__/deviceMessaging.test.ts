import {getTaskDetailIdFromNotification} from '../src/services/deviceMessaging';

describe('getTaskDetailIdFromNotification', () => {
  test.each(['addTask', 'reportTask'])('opens task detail for %s', action => {
    expect(getTaskDetailIdFromNotification({data: {action, id: '42'}})).toBe(42);
  });

  test.each([
    {data: {action: 'otherAction', id: '42'}},
    {data: {action: 'addTask', id: ''}},
    {data: {action: 'addTask', id: 'abc'}},
    {data: {action: 'reportTask', id: '1.5'}},
    {data: {action: 'reportTask', id: '0'}},
    {data: {id: '42'}},
    null,
  ])('ignores an unsupported notification: %p', notification => {
    expect(getTaskDetailIdFromNotification(notification)).toBeNull();
  });
});
