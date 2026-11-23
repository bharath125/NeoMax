import { useRef, useState } from 'react';
import { Icon, Spinner } from './Icon.jsx';
import { ImageLibraryModal } from './ImageLibraryModal.jsx';
import { useToast } from './Toast.jsx';
import { useUploadImage } from '../hooks/useImages.js';
import { apiErrorMessage } from '../lib/jobs.js';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Attach up to `max` images (uploads and/or existing ones). Controlled: `images` is the list of selected image objects.
export function ImagePicker({ images, onChange, max }) {
	const toast = useToast();
	const upload = useUploadImage();
	const inputRef = useRef(null);
	const [dragging, setDragging] = useState(false);
	const [uploads, setUploads] = useState([]); // [{ id, name, progress }]
	const [libraryOpen, setLibraryOpen] = useState(false);

	const slotsLeft = max - images.length - uploads.length;
	const busy = uploads.length > 0;

	function validate(files) {
		const accepted = [];
		for (const file of files) {
			if (!ACCEPTED_TYPES.includes(file.type)) toast.error(`“${file.name}” isn’t supported. Use PNG, JPEG or WebP.`);
			else if (file.size > MAX_FILE_BYTES) toast.error(`“${file.name}” is larger than 10 MB.`);
			else accepted.push(file);
		}
		if (accepted.length > slotsLeft) toast.info(`You can attach up to ${max} images. Extra files were skipped.`);
		return accepted.slice(0, Math.max(0, slotsLeft));
	}

	async function handleFiles(fileList) {
		const files = validate(Array.from(fileList));
		if (files.length === 0) return;

		const queued = files.map((file) => ({ id: `${file.name}-${file.size}-${Math.random()}`, file, progress: 0 }));
		setUploads((current) => [...current, ...queued]);

		const uploaded = [];
		await Promise.all(
			queued.map(async ({ id, file }) => {
				try {
					const image = await upload.mutateAsync({
						file,
						onProgress: (progress) => setUploads((current) => current.map((item) => (item.id === id ? { ...item, progress } : item))),
					});
					uploaded.push(image);
				} catch (err) {
					toast.error(`“${file.name}”: ${apiErrorMessage(err, 'Upload failed. Please try again.')}`);
				} finally {
					setUploads((current) => current.filter((item) => item.id !== id));
				}
			}),
		);
		if (uploaded.length) onChange([...images, ...uploaded]);
	}

	function handleDrop(e) {
		e.preventDefault();
		setDragging(false);
		if (slotsLeft > 0) handleFiles(e.dataTransfer.files);
	}

	const remove = (id) => onChange(images.filter((image) => image._id !== id));

	return (
		<div>
			<div className="mb-1.5 flex items-center justify-between">
				<span className="text-sm font-medium text-slate-300">
					Images <span className="font-normal text-slate-500">(optional)</span>
				</span>
				<span className="text-xs tabular-nums text-slate-500">
					{images.length}/{max}
				</span>
			</div>

			<div
				onDragOver={(e) => {
					e.preventDefault();
					setDragging(true);
				}}
				onDragLeave={() => setDragging(false)}
				onDrop={handleDrop}
				className={`rounded-xl border border-dashed p-3 transition ${dragging ? 'border-violet-400 bg-violet-500/10' : 'border-white/15 bg-white/[0.02]'}`}
			>
				{(images.length > 0 || busy) && (
					<ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
						{images.map((image, index) => (
							<li key={image._id} className="group relative aspect-square overflow-hidden rounded-lg bg-ink-900">
								<img src={image.url} alt={image.prompt || image.originalName || `Image ${index + 1}`} className="h-full w-full object-cover" />
								<span className="absolute left-1.5 top-1.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-black/70 px-1 text-[11px] font-semibold text-snow">{index + 1}</span>
								<button
									type="button"
									onClick={() => remove(image._id)}
									aria-label={`Remove image ${index + 1}`}
									className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-snow opacity-100 transition hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
								>
									<Icon name="x" className="h-3.5 w-3.5" />
								</button>
							</li>
						))}
						{uploads.map((item) => (
							<li key={item.id} className="relative grid aspect-square place-items-center overflow-hidden rounded-lg bg-ink-900" aria-label={`Uploading ${item.name}`}>
								<div className="flex flex-col items-center gap-1.5 text-xs text-slate-300">
									<Spinner className="h-5 w-5 text-violet-300" />
									<span className="tabular-nums">{item.progress}%</span>
								</div>
							</li>
						))}
					</ul>
				)}

				<div className="flex flex-wrap items-center gap-2">
					<input
						ref={inputRef}
						type="file"
						accept={ACCEPTED_TYPES.join(',')}
						multiple
						className="sr-only"
						onChange={(e) => {
							handleFiles(e.target.files);
							e.target.value = '';
						}}
						tabIndex={-1}
						aria-hidden="true"
					/>
					<button type="button" onClick={() => inputRef.current?.click()} disabled={slotsLeft <= 0} className="btn-ghost min-h-[40px] px-4">
						<Icon name="image" className="h-4 w-4" />
						Upload
					</button>
					<button type="button" onClick={() => setLibraryOpen(true)} disabled={slotsLeft <= 0} className="btn-ghost min-h-[40px] px-4">
						<Icon name="grid" className="h-4 w-4" />
						My images
					</button>
					<span className="text-xs text-slate-500">{slotsLeft > 0 ? 'or drop files here · PNG, JPEG, WebP · up to 10 MB each' : `Maximum of ${max} images reached`}</span>
				</div>
			</div>

			{libraryOpen && (
				<ImageLibraryModal
					maxSelectable={Math.max(0, slotsLeft)}
					excludeIds={images.map((image) => image._id)}
					onClose={() => setLibraryOpen(false)}
					onConfirm={(selected) => {
						onChange([...images, ...selected]);
						setLibraryOpen(false);
					}}
				/>
			)}
		</div>
	);
}
