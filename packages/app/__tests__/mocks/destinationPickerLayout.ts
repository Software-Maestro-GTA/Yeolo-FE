/**
 * @file destinationPickerLayout.ts
 * @description Supplies native country-column and row measurements that the Jest renderer does not calculate.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

/** Completes one native measurement pass, or reuses the already mounted cached list. */
export async function layoutDestinationCountries({
  width = 150,
  heights = {},
}: {
  width?: number;
  heights?: Record<string, number>;
} = {}) {
  await fireEvent(
    await screen.findByTestId('destination-country-pane'),
    'layout',
    { nativeEvent: { layout: { x: 0, y: 0, width, height: 290 } } },
  );
  await waitFor(() => {
    const measuredRows = screen.queryAllByTestId(
      /^destination-country-measure-/,
      { includeHiddenElements: true },
    );
    expect(
      Boolean(screen.queryByTestId('destination-countries')) ||
        measuredRows.length > 0,
    ).toBe(true);
  });
  const rows = screen.queryAllByTestId(/^destination-country-measure-/, {
    includeHiddenElements: true,
  });
  for (const row of rows) {
    const country = row.props.testID.replace(
      'destination-country-measure-',
      '',
    );
    await fireEvent(row, 'layout', {
      nativeEvent: {
        layout: { x: 0, y: 0, width, height: heights[country] ?? 58 },
      },
    });
  }
  return screen.findByTestId('destination-countries');
}

/** Scrolls the native list viewport when the requested row is outside its initial render window. */
export async function revealDestinationCountry(country: string) {
  const rowId = `destination-country-${country || 'popular'}`;
  if (screen.queryByTestId(rowId)) return screen.getByTestId(rowId);
  const list = screen.getByTestId('destination-countries');
  const index = list.props.data.findIndex(
    (item: { countryName: string }) => item.countryName === country,
  );
  expect(index).toBeGreaterThanOrEqual(0);
  const frame = list.props.getItemLayout(list.props.data, index);
  const last = list.props.getItemLayout(
    list.props.data,
    list.props.data.length - 1,
  );
  await fireEvent(list, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 150, height: 290 } },
  });
  await fireEvent(
    list,
    'contentSizeChange',
    150,
    last.offset + last.length + 50,
  );
  await fireEvent.scroll(list, {
    timeStamp: Date.now(),
    nativeEvent: {
      contentOffset: { x: 0, y: frame.offset },
      contentSize: { width: 150, height: last.offset + last.length + 50 },
      layoutMeasurement: { width: 150, height: 290 },
    },
  });
  return screen.findByTestId(rowId);
}
