import React, { useState, useEffect } from 'react';
import { ARRAY_ERROR } from 'final-form';
import { Form as FinalForm, Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { FieldArray } from 'react-final-form-arrays';
import isEqual from 'lodash/isEqual';
import omit from 'lodash/omit';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import { nonEmptyArray, composeValidators } from '../../../../util/validators';
import { isUploadImageOverLimitError } from '../../../../util/errors';
import { getExtensionFromUrl } from '../../../../util/urlHelpers';

// Import shared components
import { Button, Form, AspectRatioWrapper } from '../../../../components';
import { default as RemoveVideoButton } from '../../../../components/AddImages/RemoveImageButton';

// Import modules from this directory
import ListingImage from './ListingImage';
import css from './EditListingPhotosForm.module.css';

const ACCEPT_IMAGES = 'image/*';

const ImageUploadError = props => {
  return props.uploadOverLimit ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadOverLimit" />
    </p>
  ) : props.uploadImageError ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadFailed" />
    </p>
  ) : null;
};

// NOTE: PublishListingError and ShowListingsError are here since Photos panel is the last visible panel
// before creating a new listing. If that order is changed, these should be changed too.
// Create and show listing errors are shown above submit button
const PublishListingError = props => {
  return props.error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.publishListingFailed" />
    </p>
  ) : null;
};

const ShowListingsError = props => {
  return props.error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.showListingFailed" />
    </p>
  ) : null;
};

// Field component that uses file-input to allow user to select images.
export const FieldAddImage = props => {
  const { formApi, onImageUploadHandler, aspectWidth = 1, aspectHeight = 1, ...rest } = props;
  return (
    <Field form={null} {...rest}>
      {fieldprops => {
        const { accept, input, label, disabled: fieldDisabled } = fieldprops;
        const { name, type } = input;
        const onChange = e => {
          const file = e.target.files[0];
          formApi.change(`addImage`, file);
          formApi.blur(`addImage`);
          onImageUploadHandler(file);
        };
        const inputProps = { accept, id: name, name, onChange, type };
        return (
          <div className={css.addImageWrapper}>
            <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
              {fieldDisabled ? null : <input {...inputProps} className={css.addImageInput} />}
              <label htmlFor={name} className={css.addImage}>
                {label}
              </label>
            </AspectRatioWrapper>
          </div>
        );
      }}
    </Field>
  );
};

// Component that shows listing images from "images" field array
const FieldListingImage = props => {
  const { name, intl, onRemoveImage, aspectWidth, aspectHeight, variantPrefix } = props;
  return (
    <Field name={name}>
      {fieldProps => {
        const { input } = fieldProps;
        const image = input.value;
        return image ? (
          <ListingImage
            image={image}
            key={image?.id?.uuid || image?.id}
            className={css.thumbnail}
            savedImageAltText={intl.formatMessage({
              id: 'EditListingPhotosForm.savedImageAltText',
            })}
            onRemoveImage={() => onRemoveImage(image?.id)}
            aspectWidth={aspectWidth}
            aspectHeight={aspectHeight}
            variantPrefix={variantPrefix}
          />
        ) : null;
      }}
    </Field>
  );
};

/**
 * The EditListingPhotosForm component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {boolean} props.updated - Whether the form is updated
 * @param {boolean} props.updateInProgress - Whether the update is in progress
 * @param {Object} props.fetchErrors - The fetch errors object
 * @param {Object} props.initialValues - The initial values object
 * @param {propTypes.error} props.fetchErrors.publishListingError - The publish listing error
 * @param {propTypes.error} props.fetchErrors.showListingsError - The show listings error
 * @param {propTypes.error} props.fetchErrors.uploadImageError - The upload image error
 * @param {propTypes.error} props.fetchErrors.updateListingError - The update listing error
 * @param {string} props.saveActionMsg - The save action message
 * @param {Function} props.onSubmit - The submit function
 * @param {Function} props.onImageUpload - The image upload function
 * @param {Function} props.onRemoveImage - The remove image function
 * @param {Object} props.listingImageConfig - The listing image config
 * @param {Array} props.listingVideos - The listing videos
 * @param {number} props.listingImageConfig.aspectWidth - The aspect width
 * @param {number} props.listingImageConfig.aspectHeight - The aspect height
 * @param {string} props.listingImageConfig.variantPrefix - The variant prefix
 * @returns {JSX.Element}
 */
export const EditListingPhotosForm = props => {
  const { listingVideos = [] } = props;
  const [state, setState] = useState({ imageUploadRequested: false });
  const [assets, setAssets] = useState({});
  const [submittedImages, setSubmittedImages] = useState([]);

  useEffect(() => {
    const assetsObj = {};
    listingVideos.forEach(item => {
      assetsObj[item.id] = item.asset;
    });

    setAssets(assetsObj);

  }, [listingVideos.length])

  const onImageUploadHandler = file => {
    const { listingImageConfig, onImageUpload } = props;
    if (file) {
      setState({ imageUploadRequested: true });

      onImageUpload({ id: `${file.name}_${Date.now()}`, file }, listingImageConfig)
        .then(() => {
          setState({ imageUploadRequested: false });
        })
        .catch(() => {
          setState({ imageUploadRequested: false });
        });
    }
  };
  const intl = useIntl();

  const videoClipsText = (
    <span className={css.chooseImageText}>
      <span className={css.chooseImage}>
        <FormattedMessage
          id="EditListingPhotosForm.chooseVideoClip"
          values={{ count: Object.keys(assets).length + 1 }}
        />
      </span>
      <span className={css.imageDimension}>
        <FormattedMessage id="EditListingPhotosForm.videoClipDimension" />
      </span>
      <span className={css.imageTypes}>
        <FormattedMessage id="EditListingPhotosForm.videoClipSize" />
      </span>
    </span>
  );

  const submitHandler = values => {
    const { listingVideos, ...restValues } = values;
    const normalizedListingVideos = listingVideos
      ? listingVideos.map(item => {
        return {
          ...item,
          asset: assets[item.id],
        };
      })
      : [];

    const updatePublicData = {
      publicData: {
        listingVideos: normalizedListingVideos,
      },
    };

    props.onSubmit({ ...restValues, ...updatePublicData });
  };

  return (
    <FinalForm
      {...props}
      mutators={{ ...arrayMutators }}
      onSubmit={submitHandler}
      initialValues={{
        ...props.initialValues,
        listingVideos: props.listingVideos
      }}
      render={formRenderProps => {
        const {
          form,
          className,
          fetchErrors,
          handleSubmit,
          invalid,
          onRemoveImage,
          disabled,
          ready,
          saveActionMsg,
          updated,
          updateInProgress,
          touched,
          errors,
          values,
          listingImageConfig,
        } = formRenderProps;

        const images = values.images ?? [];
        const { aspectWidth = 1, aspectHeight = 1, variantPrefix } = listingImageConfig;

        const { publishListingError, showListingsError, updateListingError, uploadImageError } =
          fetchErrors || {};
        const uploadOverLimit = isUploadImageOverLimitError(uploadImageError);

        // imgs can contain added images (with temp ids) and submitted images with uniq ids.
        const arrayOfImgIds = imgs => imgs.map(i => (typeof i.id === 'string' ? i.imageId : i.id));
        const imageIdsFromProps = arrayOfImgIds(images);
        const imageIdsFromPreviousSubmit = arrayOfImgIds(submittedImages);
        const imageArrayHasSameImages = isEqual(imageIdsFromProps, imageIdsFromPreviousSubmit);
        const submittedOnce = submittedImages.length > 0;
        const pristineSinceLastSubmit = submittedOnce && imageArrayHasSameImages;

        const submitReady = (updated && pristineSinceLastSubmit) || ready;
        const submitInProgress = updateInProgress;
        const submitDisabled =
          invalid || disabled || submitInProgress || state.imageUploadRequested || ready;
        const imagesError = touched.images && errors?.images && errors.images[ARRAY_ERROR];

        const classes = classNames(css.root, className);

        const uploadVideoWidget = (e, form) => {
          e.preventDefault();
          if (typeof window !== 'undefined') {
            window.cloudinary.openUploadWidget(
              {
                cloudName: 'mahuwo',
                uploadPreset: 'mahuwo',
                maxVideoFileSize: 100000000,
                resourceType: 'video',
                maxFiles: 5 - Object.keys(assets).length || 5,
                allowedFormats: ['mp4'],
              },
              (error, result) => {
                if (result && result.info && result.info.secure_url) {
                  const index = Object.keys(assets)?.length || 0;
                  const uniqId = `listingVideos[${index}]`;
                  const listingVideoIds = Object.keys(assets).map((_, index) => ({
                    id: `listingVideos[${index}]`,
                  }));
                  form.change('listingVideos', [...listingVideoIds, { id: uniqId }]);

                  setAssets({
                    ...assets,
                    [uniqId]: { url: result.info.secure_url, type: result.info.resource_type },
                  });
                }
              }
            );
          }
        };

        return (
          <Form
            className={classes}
            onSubmit={e => {
              setSubmittedImages(images);
              handleSubmit(e);
            }}
          >
            {updateListingError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingPhotosForm.updateFailed" />
              </p>
            ) : null}

            <div className={css.imagesFieldArray}>
              <FieldArray
                name="images"
                validate={composeValidators(
                  nonEmptyArray(
                    intl.formatMessage({
                      id: 'EditListingPhotosForm.imageRequired',
                    })
                  )
                )}
              >
                {({ fields }) =>
                  fields.map((name, index) => (
                    <FieldListingImage
                      key={name}
                      name={name}
                      onRemoveImage={imageId => {
                        fields.remove(index);
                        onRemoveImage(imageId);
                      }}
                      intl={intl}
                      aspectWidth={aspectWidth}
                      aspectHeight={aspectHeight}
                      variantPrefix={variantPrefix}
                    />
                  ))
                }
              </FieldArray>

              <FieldAddImage
                id="addImage"
                name="addImage"
                accept={ACCEPT_IMAGES}
                label={
                  <span className={css.chooseImageText}>
                    <span className={css.chooseImage}>
                      <FormattedMessage id="EditListingPhotosForm.chooseImage" />
                    </span>
                    <span className={css.imageTypes}>
                      <FormattedMessage id="EditListingPhotosForm.imageTypes" />
                    </span>
                  </span>
                }
                type="file"
                disabled={state.imageUploadRequested}
                formApi={form}
                onImageUploadHandler={onImageUploadHandler}
                aspectWidth={aspectWidth}
                aspectHeight={aspectHeight}
              />
            </div>

            {imagesError ? <div className={css.arrayError}>{imagesError}</div> : null}

            <ImageUploadError
              uploadOverLimit={uploadOverLimit}
              uploadImageError={uploadImageError}
            />

            <p className={css.tip}>
              <FormattedMessage id="EditListingPhotosForm.addImagesTip" />
            </p>

            <PublishListingError error={publishListingError} />
            <ShowListingsError error={showListingsError} />

            <h3>動画</h3>
            <div>
              <div className={css.videoClipWrapper}>
                {assets
                  ? Object.keys(assets).map((item, index) => (
                    <div key={index}>
                      <div className={css.pictureContainer}>
                        <video src={assets[item].url} controls width="100%">
                          <source
                            src={assets[item].url}
                            type={`video/${getExtensionFromUrl(assets[item].url)}`}
                          />
                        </video>

                        <RemoveVideoButton
                          onClick={e => {
                            e.preventDefault();
                            const updatedAssets = omit(assets, item);
                            const squenceAssets = Object.keys(updatedAssets).map(
                              (item, index) => updatedAssets[item]
                            );
                            const upAssets = squenceAssets.reduce(
                              (obj, item, index) => ({
                                ...obj,
                                [`listingVideos[${index}]`]: item,
                              }),
                              {}
                            );

                            const listingVideoIds = Object.keys(
                              updatedAssets
                            ).map((_, index) => ({ id: `listingVideos[${index}]` }));
                            form.change('listingVideos', listingVideoIds);
                            setAssets(upAssets);
                          }}
                        />
                      </div>
                    </div>
                  ))
                  : null}

                {Object.keys(assets).length < 5 && (
                  <div
                    onClick={e => {
                      uploadVideoWidget(e, form);
                    }}
                    className={css.addVideoWrapper}
                  >
                    <div className={css.aspectRatioWrapper}>
                      <label className={css.addImage}>{videoClipsText}</label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
              ready={submitReady}
            >
              {saveActionMsg}
            </Button>
          </Form>
        );
      }}
    />
  );
};

export default EditListingPhotosForm;
