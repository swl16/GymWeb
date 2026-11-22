'use client';
import ClassPicture from '@/components/ui/ClassPicture';
import Button from '@/components/ui/Button';
import { table } from '@/components/ui/DataTable';
import { useGym } from '@/features/app/GymProvider';
import { money } from '@/lib/validation.mjs';
/** CLASS CATALOG UI: create definitions before assigning dated sessions and trainers. */
export default function ClassTypesPanel() {
  const { data, open } = useGym();
  return (
    <section className="panel mb">
      <div className="panel-heading">
        <div>
          <h2>Class types</h2>
          <p>Create a class type, then add its sessions below.</p>
        </div>
        <Button variant="primary" onClick={() => open('class-type')}>
          Add class type
        </Button>
      </div>
      {table(
        ['Picture', 'Class name', 'Default fee', 'Capacity', 'Action'],
        data.class_types
          .filter((c) => !c.archived)
          .map((c) => [
            <ClassPicture
              name={c.name}
              imagePath={c.image_path}
              className="class-type-thumbnail"
            />,
            c.name,
            money(c.fee),
            c.default_capacity,
            <Button key={c.id} variant="text" onClick={() => open('class-type', c)}>
              Edit class type
            </Button>,
          ]),
        'No class types yet. Add your first class type.',
      )}
    </section>
  );
}
