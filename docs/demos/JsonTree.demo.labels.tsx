import { JsonTree } from '@gfazioli/mantine-json-tree';
import { MantineDemo } from '@mantinex/demo';

const data = {
  ordine: 'A-1024',
  cliente: { nome: 'Ada', citta: 'Torino' },
  righe: ['tazza', 'maglietta', 'quaderno', 'penna', 'agenda', 'matita'],
  note: 'Consegna al piano terra, citofono interno 4',
};

function Demo() {
  return (
    <JsonTree
      data={data}
      title="ordine.json"
      withBorder
      defaultExpanded
      maxDepth={-1}
      rootName={false}
      indentWidth={20}
      withSearch
      withExpandAll
      withCopyAll
      withCopyToClipboard
      collapseStringsAfterLength={20}
      maxDisplayLength={4}
      searchPlaceholder="Filtra chiavi e valori..."
      labels={{
        copy: 'Copia',
        copied: 'Copiato',
        copyAll: 'Copia JSON',
        expandAll: 'Espandi tutto',
        collapseAll: 'Comprimi tutto',
        search: 'Cerca',
        showMore: 'mostra tutto',
        showLess: 'mostra meno',
        // Italian, unlike English, changes the noun and the adjective in the singular
        moreItems: (count, unit) => {
          const keys = unit === 'keys';
          return count === 1
            ? `… un altro ${keys ? 'campo' : 'elemento'}`
            : `… altri ${count} ${keys ? 'campi' : 'elementi'}`;
        },
      }}
    />
  );
}

const code = `
import { JsonTree } from '@gfazioli/mantine-json-tree';

const data = {
  ordine: 'A-1024',
  cliente: { nome: 'Ada', citta: 'Torino' },
  righe: ['tazza', 'maglietta', 'quaderno', 'penna', 'agenda', 'matita'],
  note: 'Consegna al piano terra, citofono interno 4',
};

function Demo() {
  return (
    <JsonTree
      data={data}
      title="ordine.json"
      withBorder
      defaultExpanded
      maxDepth={-1}
      rootName={false}
      indentWidth={20}
      withSearch
      withExpandAll
      withCopyAll
      withCopyToClipboard
      collapseStringsAfterLength={20}
      maxDisplayLength={4}
      searchPlaceholder="Filtra chiavi e valori..."
      labels={{
        copy: 'Copia',
        copied: 'Copiato',
        copyAll: 'Copia JSON',
        expandAll: 'Espandi tutto',
        collapseAll: 'Comprimi tutto',
        search: 'Cerca',
        showMore: 'mostra tutto',
        showLess: 'mostra meno',
        // Italian, unlike English, changes the noun and the adjective in the singular
        moreItems: (count, unit) => {
          const keys = unit === 'keys';
          return count === 1
            ? \`… un altro \${keys ? 'campo' : 'elemento'}\`
            : \`… altri \${count} \${keys ? 'campi' : 'elementi'}\`;
        },
      }}
    />
  );
}
`;

export const labels: MantineDemo = {
  type: 'code',
  component: Demo,
  code,
  defaultExpanded: false,
};
