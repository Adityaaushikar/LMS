<script lang="ts">
  import * as AddBlock from '@cio/ui/custom/add-block';
  import type { AddBlockChoice } from '@cio/ui/custom/add-block';
  import { t } from '$lib/utils/functions/translations';
  import { isBlockType, type TBlockType } from '@cio/utils/validation/block';
  import { getAddBlockChoices } from '../utils/block-choices';

  interface Props {
    onSelect: (type: TBlockType) => void;
  }

  let { onSelect }: Props = $props();

  const choices = $derived<AddBlockChoice[]>(getAddBlockChoices());

  function handleSelect(type: string) {
    if (!isBlockType(type)) return;

    onSelect(type);
  }
</script>

<AddBlock.Row
  {choices}
  addLabel={t.get('course.navItem.lessons.materials.blocks.add_content')}
  showAi={false}
  rowTestId="block-add-row"
  toolbarTestId="block-add-toolbar"
  onSelect={handleSelect}
/>
