"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queries = void 0;
exports.queries = {
    //TODO: update
    queryItemColumnsValues: `query ($itemId: [ID!]) {
    items(ids: $itemId) {
      id
      name
      parent_item {
        id
      }
      column_values {
        id
        text
      }
    }
    complexity {
      before
      reset_in_x_seconds
      after
    }
  }
  `,
    //updated with cursor query
    getItemsColumnValuesByBoardId: `query ($boardId: [ID!], $limit: Int!) {
    boards(ids: $boardId) {
      items_page(limit: $limit) {
        cursor
        items {
          id
          name
          column_values {
            id
            text
          }
        }
      }
    }
    complexity {
      before
      reset_in_x_seconds
      after
    }
  }`,
    getItemsColumnValuesByBoardIdCursor: `query ($boardId: [ID!], $limit: Int!, $cursor: String!) {
    boards(ids: $boardId) {
      items_page(limit: $limit, cursor: $cursor) {
        cursor
        items {
          id
          name
          column_values {
            id
            text
          }
        }
      }
    }
    complexity {
      before
      reset_in_x_seconds
      after
    }
  }`,
    //updated with cursor query
    queryItemsByColumnValue: `query ($boardId: ID!, $columnId: String!, $columnValue: [String]!, $limit: Int) {
    items_page_by_column_values(
      board_id: $boardId
      columns: [{column_id: $columnId, column_values: $columnValue}]
      limit: $limit
    ) {
      cursor
      items {
        id
        name
        parent_item {
          id
        }
        column_values {
          id
          text
        }
      }
    }
    complexity {
      before
      reset_in_x_seconds
      after
    }
  }
  `,
    queryItemsByColumnValueCursor: `query ($boardId: ID!, $limit: Int, $cursor: String!) {
    items_page_by_column_values(board_id: $boardId, limit: $limit, cursor: $cursor) {
      cursor
      items {
        id
        name
        parent_item {
          id
        }
        column_values {
          id
          text
        }
      }
    }
    complexity {
      before
      reset_in_x_seconds
      after
    }
  }
  `,
    //updated
    querySubItems: `query ($itemId: [ID!]) {
    items(ids: $itemId) {
      subitems {
        id
        name
        parent_item {
          id
        }
        column_values {
          id
          text
        }
      }
    }
    complexity {
      before
      reset_in_x_seconds
      after
    }
  }
  `,
    //updated
    changeItemColumnValue: `mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
    change_multiple_column_values(
      board_id: $boardId
      item_id: $itemId
      column_values: $columnValues
    ) {
      id
    }
    complexity {
      before
      reset_in_x_seconds
      after
    }
  }
  `,
    //updated
    createItem: `mutation($boardId: ID!, $itemName: String!, $columnValues: JSON) {
      create_item (board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
          id
      }
      complexity {
        before
        reset_in_x_seconds
        after
      }
    }
  `,
    //updated
    createNotification: `mutation ($text: String!, $userId: ID!, $targetId: ID!) {
    create_notification(
      user_id: $userId
      target_id: $targetId
      text: $text
      target_type: Project
    ) {
      text
    }
    complexity {
      before
      reset_in_x_seconds
      after
    }
  }
  `,
    //updated
    getUserId: `query ($name: String){
      users (name: $name) {
        id
      }
      complexity {
        before
        reset_in_x_seconds
        after
      }
    }
  `,
};
//# sourceMappingURL=monday-queries.js.map